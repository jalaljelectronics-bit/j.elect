// Stage 1: DRY RUN — read-only.
// Confirms every wp.com-hosted product image is actually reachable and a
// real image, before we touch Cloudinary or the database at all.
// Writes results to migration-dry-run.json. No writes anywhere else.

require('dotenv').config();
const { Client } = require('pg');
const fetch = require('node-fetch');
const fs = require('fs');

const SOURCE_MATCH = '%wp.com%'; // adjust if you want to include gstatic/amazon too

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(
    `SELECT id, name, "imageUrl" FROM "Product"
     WHERE "imageUrl" LIKE $1
       AND "imageUrl" IS NOT NULL
       AND "imageUrl" != ''
     ORDER BY id ASC`,
    [SOURCE_MATCH]
  );

  console.log(`Found ${rows.length} products to check.\n`);

  const results = [];
  let ok = 0, failed = 0;

  for (const [i, row] of rows.entries()) {
    process.stdout.write(`[${i + 1}/${rows.length}] id=${row.id} `);
    try {
      const res = await fetch(row.imageUrl, { method: 'GET', redirect: 'follow' });
      const contentType = res.headers.get('content-type') || '';
      const isImage = res.ok && contentType.startsWith('image/');

      results.push({
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl,
        status: isImage ? 'ok' : 'failed',
        httpStatus: res.status,
        contentType,
      });

      if (isImage) {
        ok++;
        console.log(`OK (${contentType}, ${res.status})`);
      } else {
        failed++;
        console.log(`FAILED (status ${res.status}, type "${contentType}")`);
      }
    } catch (err) {
      failed++;
      results.push({
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl,
        status: 'failed',
        error: err.message,
      });
      console.log(`FAILED (${err.message})`);
    }

    // Be polite to the source server — small delay between requests
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(
    'migration-dry-run.json',
    JSON.stringify(results, null, 2)
  );

  console.log(`\nDone. ${ok} ok, ${failed} failed out of ${rows.length}.`);
  console.log('Full report written to migration-dry-run.json');
  if (failed > 0) {
    console.log('\nReview the failed entries before proceeding to stage 2.');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Dry run crashed:', err);
  process.exit(1);
});