// api/render/[...slug].js
// Vercel serverless function (Node runtime, NOT Edge — Puppeteer needs
// real Node APIs and a native Chromium binary, which Edge can't run).
//
// middleware.js rewrites crawler requests here, e.g.:
//   /product/1842  ->  /api/render/product/1842
//   /blog/my-post  ->  /api/render/blog/my-post
//   /project/42    ->  /api/render/project/42
//
// Flow:
//   1. Parse type + id/slug from the URL.
//   2. Fetch current updatedAt for that item from the existing backend API.
//   3. Check Redis (getCachedRender) — serve cached HTML if still fresh.
//   4. On miss: launch Puppeteer, load the real page from the live site,
//      wait for React to render, grab the final HTML, cache it, return it.
//
// Install with: npm install puppeteer-core @sparticuz/chromium
// (Both already proven working in this project's build-time prerender step.)

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { getCachedRender, setCachedRender } from '../../lib/redis.js';

// Vercel function config — Puppeteer needs more time/memory than the
// default. 60s covers Pro's standard limit; bump toward 300+ with Fluid
// Compute enabled if cold starts prove tight in practice.
export const config = {
  maxDuration: 60,
};

// Maps URL segments to backend API routes + Redis cache "type" labels.
// Adjust the path prefixes here if your backend API routes differ.
const TYPE_CONFIG = {
  product: { apiPath: '/api/products', cacheType: 'product' },
  blog: { apiPath: '/api/blog', cacheType: 'blog' },
  project: { apiPath: '/api/projects', cacheType: 'project' },
};

const BACKEND_API_BASE = process.env.BACKEND_API_URL; // e.g. https://your-backend.up.railway.app
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://jelectronics.store';

export default async function handler(request, response) {
  const slug = request.query.slug; // array, e.g. ['product', '1842']

  if (!Array.isArray(slug) || slug.length < 2) {
    return response.status(400).send('Bad render request');
  }

  const [type, id] = slug;
  const typeConfig = TYPE_CONFIG[type];

  if (!typeConfig) {
    return response.status(404).send('Unknown content type');
  }

  try {
    // 1. Get current updatedAt from the live backend (source of truth).
    const itemRes = await fetch(`${BACKEND_API_BASE}${typeConfig.apiPath}/${id}`);

    if (!itemRes.ok) {
      // Item doesn't exist (deleted, bad id, etc.) — don't render, just 404.
      return response.status(404).send('Not found');
    }

    const item = await itemRes.json();
    const currentUpdatedAt = item.updatedAt;

    // 2. Check Redis for a still-valid cached render.
    const cachedHtml = await getCachedRender(typeConfig.cacheType, id, currentUpdatedAt);

    if (cachedHtml) {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('X-Render-Cache', 'HIT');
      return response.status(200).send(cachedHtml);
    }

    // 3. Cache miss or stale — render this single page with Puppeteer.
    const html = await renderPage(`${SITE_ORIGIN}/${type}/${id}`);

    // 4. Save to Redis for next time, then serve.
    await setCachedRender(typeConfig.cacheType, id, html, currentUpdatedAt);

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('X-Render-Cache', 'MISS');
    return response.status(200).send(html);
  } catch (err) {
    console.error('Render error:', err);
    return response.status(500).send('Render failed');
  }
}

async function renderPage(url) {
  // process.env.VERCEL is set automatically in Vercel's deployed
  // environments (build + serverless functions), but NOT when running
  // locally via `vercel dev`. @sparticuz/chromium's binary only runs on
  // Vercel/Lambda's Amazon Linux — it can't execute on a local dev
  // machine, so fall back to a locally-installed Chrome there instead.
  const isLocal = !process.env.VERCEL;

  const launchOptions = isLocal
    ? {
        // Requires a local Chrome/Chromium install. Set this env var to
        // its path, e.g. on Mac:
        // LOCAL_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        executablePath:
          process.env.LOCAL_CHROME_PATH ||
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      }
    : {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // 'networkidle0' waits until the page's network activity settles,
    // giving the React app time to fetch its data and render real content
    // instead of grabbing the empty <div id="root"> shell.
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}