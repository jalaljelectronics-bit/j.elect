
// frontend/middleware.js
//
// Vercel Edge Middleware
//
// Purpose:
// - Detect search-engine/social-preview crawlers.
// - Rewrite crawler requests for products, blogs and projects
//   to the server-side rendering endpoint.
// - Let normal visitors and Puppeteer reach the real React SPA.
//
// IMPORTANT:
// Do not put a debug return before the bot check.
// Puppeteer must be able to load /product/:id normally.

import { rewrite } from '@vercel/edge';

export const config = {
  matcher: [
    '/product/:path*',
    '/blog/:path*',
    '/project/:path*',
  ],
};

const BOT_UA_REGEX =
  /googlebot|bingbot|yandex(bot)?|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/?bot|slackbot|vkshare|w3c_validator|whatsapp|redditbot|applebot|telegrambot|discordbot/i;

export default function middleware(request) {
  const userAgent =
    request.headers.get('user-agent') || '';

  // Normal visitors and Puppeteer:
  // allow the request to continue to the React application.
  if (!BOT_UA_REGEX.test(userAgent)) {
    return;
  }

  // Crawlers:
  // rewrite the clean public URL to the render function.
  const url = new URL(request.url);

  const renderUrl = new URL(
    `/api/render${url.pathname}`,
    url.origin
  );

  return rewrite(renderUrl);
}

