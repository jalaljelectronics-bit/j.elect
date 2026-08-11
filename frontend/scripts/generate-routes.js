// scripts/generate-routes.js

async function main() {
  console.log(`[generate-routes] Fetching routes from ${API_URL} ...`);

  const [blogIds, projectIds] = await Promise.all([
    fetchBlogIds(),
    fetchProjectIds(),
    // fetchProductIds() intentionally NOT called for prerendering anymore.
    // Product pages are served to crawlers on-demand via
    // /api/render/product/[id].js (Puppeteer + Redis cache), and to
    // normal visitors via the SPA fallback in vercel.json. Build-time
    // prerendering all ~688 products added ~7 of the ~8 minute build
    // time for zero benefit, since crawlers never hit the static file
    // anyway (middleware always rewrites them to the on-demand renderer).
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
    // no product routes here
  ];

  const outPath = path.join(__dirname, 'routes.json');
  fs.writeFileSync(outPath, JSON.stringify(routes, null, 2));
  console.log(
    `[generate-routes] Wrote ${routes.length} routes ` +
    `(${blogIds.length} blog posts, ${projectIds.length} projects) to ${outPath}`
  );
}