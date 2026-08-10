// middleware.js
// Vercel Edge Middleware — runs before every matched request, at the edge,
// before any serverless function or the static SPA shell is hit.
//
// Job: detect search-engine / social-preview crawlers by User-Agent.
//   - Crawler match  -> rewrite to /api/render/<original path>, which returns
//                       a fully-rendered HTML snapshot (see render function).
//   - Everything else -> fall through untouched, human visitors get the
//                       normal fast client-side-rendered SPA, exactly as today.
//
// Uses @vercel/edge instead of next/server since this is a Vite project,
// not Next.js. Install with: npm install @vercel/edge

import { rewrite } from '@vercel/edge';

// Only run this middleware on routes that actually have dynamic,
// crawlable content. No point paying the Edge invocation cost on
// asset requests, API calls, etc.
export const config = {
  matcher: [
    '/product/:path*',
    '/blog/:path*',
    '/project/:path*',
  ],
};

// Known crawler / link-preview bot user-agent substrings.
// Kept as one regex so it's cheap to test and easy to extend.
// Add more as you find bots you care about (e.g. specific SEO tools).
const BOT_UA_REGEX =
  /googlebot|bingbot|yandex(bot)?|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/?bot|slackbot|vkshare|w3c_validator|whatsapp|redditbot|applebot|telegrambot|discordbot/i;

export default function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!BOT_UA_REGEX.test(userAgent)) {
    // Human (or unrecognized) visitor — do nothing, let the normal
    // SPA / static routing handle the request as it does today.
    return;
  }

  // Crawler matched — rewrite (not redirect) so the URL in the browser/
  // crawler's address bar stays the original clean URL, while the actual
  // response comes from our rendering endpoint.
  const url = new URL(request.url);
  const renderUrl = new URL(`/api/render${url.pathname}`, url.origin);

  return rewrite(renderUrl);
}