// scripts/generate-routes.js
//
// Runs BEFORE `vite build` (wired up as "prebuild" in package.json).
// Pulls every published blog post ID and every project ID from your
// live API, then writes them to routes.json so vite.config.js can read
// them synchronously at build time.
//
// Uses the same public endpoints your frontend already calls
// (see src/api/blogService.js and src/api/projectService.js), so no
// extra backend work is needed.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Same env var your axios clients use in production builds.
const API_URL = process.env.VITE_API_URL || 'https://www.jelectronics.store';

async function fetchBlogIds() {
  const res = await fetch(`${API_URL}/api/blog?limit=1000`);
  if (!res.ok) throw new Error(`Blog API returned ${res.status}`);
  const data = await res.json();
  const posts = data.posts || [];

  // Mirror the same "only show published posts publicly" rule used in
  // src/pages/Blog.jsx — never prerender/expose a draft's URL.
  return posts
    .filter((p) => p.status === 'Published')
    .map((p) => p.id);
}

async function fetchProjectIds() {
  // getProjects() is paginated (limit: 12 in the UI), so page through
  // all results here to get every project, not just the first page.
  const ids = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(`${API_URL}/api/projects?page=${page}&limit=100`);
    if (!res.ok) throw new Error(`Projects API returned ${res.status}`);
    const data = await res.json();

    (data.projects || []).forEach((p) => ids.push(p.id));
    totalPages = data.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return ids;
}

async function main() {
  console.log(`[generate-routes] Fetching routes from ${API_URL} ...`);

  const [blogIds, projectIds] = await Promise.all([
    fetchBlogIds(),
    fetchProjectIds(),
  ]);

  const routes = [
    '/',
    '/products',
    '/projects',
    '/blog',
    '/about',
    '/contact',
    '/policies',
    ...blogIds.map((id) => `/blog/${id}`),
    ...projectIds.map((id) => `/project/${id}`),
  ];

  const outPath = path.join(__dirname, 'routes.json');
  fs.writeFileSync(outPath, JSON.stringify(routes, null, 2));
  console.log(
    `[generate-routes] Wrote ${routes.length} routes ` +
    `(${blogIds.length} blog posts, ${projectIds.length} projects) to ${outPath}`
  );
}

main().catch((err) => {
  console.error('[generate-routes] Failed:', err.message);
  // Avoid process.exit(1) here — on Windows, forcing an exit while a
  // fetch() is still tearing down its network handles can trigger a
  // libuv assertion crash unrelated to the actual error. Setting
  // exitCode and letting Node exit naturally avoids that.
  process.exitCode = 1;
});