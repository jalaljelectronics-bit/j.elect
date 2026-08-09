// Stage 2: LIVE RUN — uploads verified images to Cloudinary, then updates
// the Product.imageUrl column in the production database.
//
// SAFETY: by default this only processes the first 5 products, so you can
// eyeball the result before running the full batch.
//
// Usage:
//   node 2-migrate.js              -> test run, first 5 products only
//   node 2-migrate.js --all        -> full run, all "ok" products from dry run
//   node 2-migrate.js --limit=20   -> custom batch size

require('dotenv').config();
const { Client } = require('pg');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const args = process.argv.slice(2);
const runAll = args.includes('--all');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (runAll ? Infinity : 5);

async function main() {
  if (!fs.existsSync('migration-dry-run.json')) {
    console.error('migration-dry-run.json not found. Run 1-dry-run.js first.');
    process.exit(1);
  }

  const dryRunResults = JSON.parse(fs.readFileSync('migration-dry-run.json', 'utf-8'));
  const candidates = dryRunResults.filter((r) => r.status === 'ok').slice(0, limit);

  console.log(`Processing ${candidates.length} product(s).`);
  if (!runAll && limit !== Infinity) {
    console.log(`(Test mode — run with --all once you've verified these look correct.)\n`);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const results = [];
  let succeeded = 0, failed = 0;

  for (const [i, item] of candidates.entries()) {
    process.stdout.write(`[${i + 1}/${candidates.length}] id=${item.id} "${item.name}" `);
    try {
      // Download the image ourselves first (Cloudinary's own remote-fetch
      // is blocked on this account), then upload the raw bytes directly.
      const imgRes = await fetch(item.imageUrl);
      if (!imgRes.ok) {
        throw new Error(`Source fetch failed: ${imgRes.status}`);
      }
      const buffer = await imgRes.buffer();
      const base64 = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;

      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: 'jelectronics-products-migrated',
        public_id: `product-${item.id}`,
        overwrite: true,
      });

      const newUrl = uploadResult.secure_url;

      await client.query(
        `UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2`,
        [newUrl, item.id]
      );

      results.push({
        id: item.id,
        name: item.name,
        oldUrl: item.imageUrl,
        newUrl,
        status: 'migrated',
      });
      succeeded++;
      console.log(`-> ${newUrl}`);
    } catch (err) {
      results.push({
        id: item.id,
        name: item.name,
        oldUrl: item.imageUrl,
        status: 'failed',
        error: err.message,
      });
      failed++;
      console.log(`FAILED (${err.message})`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  const logFile = `migration-live-run-${Date.now()}.json`;
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));

  console.log(`\nDone. ${succeeded} migrated, ${failed} failed.`);
  console.log(`Log written to ${logFile}`);
  if (!runAll && limit !== Infinity) {
    console.log(`\nThis was a test batch. Check the products above on your live site,`);
    console.log(`then run "node 2-migrate.js --all" to process the remaining ones.`);
  }

  await client.end();
}

main().catch((err) => {
  console.error('Migration crashed:', err);
  process.exit(1);
});