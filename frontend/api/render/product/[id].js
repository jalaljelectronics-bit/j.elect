// frontend/api/render/product/[id].js

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import {
  getCachedRender,
  setCachedRender,
} from '../../../lib/redis.js';

export const config = {
  maxDuration: 60,
};

const BACKEND_API_BASE = process.env.BACKEND_API_URL;
const SITE_ORIGIN =
  process.env.SITE_ORIGIN || 'https://www.jelectronics.store';

export default async function handler(request, response) {
  const { id } = request.query;

  if (!id) {
    return response.status(400).send('Product ID is required');
  }

  if (!BACKEND_API_BASE) {
    console.error('BACKEND_API_URL is not configured');
    return response
      .status(500)
      .send('BACKEND_API_URL is not configured');
  }

  try {
    // 1. Get the current product from the backend.
    const apiUrl =
      `${BACKEND_API_BASE}/api/products/${encodeURIComponent(id)}`;

    console.log(`Fetching product: ${apiUrl}`);

    const itemRes = await fetch(apiUrl);

    if (!itemRes.ok) {
      console.error(
        `Backend returned ${itemRes.status} for ${apiUrl}`
      );

      return response.status(404).send('Product not found');
    }

    const item = await itemRes.json();

    const currentUpdatedAt = item.updatedAt || null;

    // 2. Check Redis.
    const cachedHtml = await getCachedRender(
      'product',
      id,
      currentUpdatedAt
    );

    if (cachedHtml) {
      response.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );

      response.setHeader('X-Render-Cache', 'HIT');

      response.setHeader(
        'Cache-Control',
        'private, no-store, max-age=0'
      );

      return response.status(200).send(cachedHtml);
    }

    // 3. Render the actual product page.
    const pageUrl =
      `${SITE_ORIGIN}/product/${encodeURIComponent(id)}`;

    console.log(`Rendering product page: ${pageUrl}`);

    const html = await renderPage(pageUrl);

    // 4. Cache the rendered HTML.
    await setCachedRender(
      'product',
      id,
      html,
      currentUpdatedAt
    );

    response.setHeader(
      'Content-Type',
      'text/html; charset=utf-8'
    );

    response.setHeader('X-Render-Cache', 'MISS');

    response.setHeader(
      'Cache-Control',
      'private, no-store, max-age=0'
    );

    return response.status(200).send(html);
  } catch (error) {
    console.error('Product render error:', error);

    return response
      .status(500)
      .send(
        `Render failed: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
  }
}

async function renderPage(url) {
  const isLocal = !process.env.VERCEL;

  const launchOptions = isLocal
    ? {
        executablePath:
          process.env.LOCAL_CHROME_PATH ||
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      }
    : {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };

  console.log('Launching Chromium...');

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    return await page.content();
  } finally {
    await browser.close();
  }
}