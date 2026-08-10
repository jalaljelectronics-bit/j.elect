// lib/redis.js
// Single shared Upstash Redis client, built on the REST API rather than a
// persistent TCP connection. This is what makes it usable from:
//   - Vercel Edge Middleware / Edge Functions (no raw TCP sockets allowed)
//   - Vercel serverless functions (rendering function will use this)
//   - The existing Express/Railway backend (for the secondary caching use case)
//
// Install with: npm install @upstash/redis
//
// Requires these env vars to be set wherever this file is imported
// (Vercel project settings, and Railway if used there too):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// --- Render-cache helpers -----------------------------------------------
// Cache key scheme: render:<type>:<id>  ->  { html, updatedAt, renderedAt }
// type is one of: product | blog | project

/**
 * Look up a cached render for a given item, and validate it against the
 * item's current updatedAt. Returns the cached HTML only if it's still
 * fresh; otherwise returns null so the caller knows to re-render.
 *
 * @param {"product"|"blog"|"project"} type
 * @param {string|number} id
 * @param {string} currentUpdatedAt - ISO timestamp from Postgres/Prisma
 * @returns {Promise<string|null>}
 */
export async function getCachedRender(type, id, currentUpdatedAt) {
  const key = `render:${type}:${id}`;
  const cached = await redis.get(key);

  if (!cached) return null;

  // Upstash auto-deserializes JSON values, but guard against a raw string
  // just in case an older entry was stored differently.
  const entry = typeof cached === 'string' ? JSON.parse(cached) : cached;

  if (entry.updatedAt !== currentUpdatedAt) {
    // Underlying data changed since this was rendered — treat as a miss.
    return null;
  }

  return entry.html;
}

/**
 * Store a freshly-rendered snapshot in the cache.
 * A long safety-net TTL (30 days) guards against orphaned entries from
 * missed invalidation calls or bulk DB operations that bypass the
 * controller hooks — updatedAt is the real freshness check, this is
 * just cleanup insurance.
 *
 * @param {"product"|"blog"|"project"} type
 * @param {string|number} id
 * @param {string} html
 * @param {string} updatedAt - ISO timestamp from Postgres/Prisma
 */
export async function setCachedRender(type, id, html, updatedAt) {
  const key = `render:${type}:${id}`;
  const entry = {
    html,
    updatedAt,
    renderedAt: new Date().toISOString(),
  };

  const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
  await redis.set(key, JSON.stringify(entry), { ex: THIRTY_DAYS_SECONDS });
}

/**
 * Proactively remove a cached render — call this from the existing
 * blogController.js / projectController.js / productController.js hooks
 * on update or delete, right alongside the existing deploy-hook trigger.
 * This makes the next crawler visit force a fresh render instead of
 * waiting for the updatedAt mismatch check to catch it.
 *
 * @param {"product"|"blog"|"project"} type
 * @param {string|number} id
 */
export async function invalidateCachedRender(type, id) {
  const key = `render:${type}:${id}`;
  await redis.del(key);
}