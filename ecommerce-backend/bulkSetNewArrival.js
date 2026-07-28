// One-time script: marks ALL existing products as isNewArrival = true.
// Safe to run once — only touches the isNewArrival column, nothing else.
// Run from your ecommerce-backend folder where prisma/client is set up.

const prisma = require("./prisma/client");

async function run() {
  // Step 1: preview how many rows will be affected, before writing anything.
  const totalProducts = await prisma.product.count();
  const alreadyTrue = await prisma.product.count({
    where: { isNewArrival: true },
  });

  console.log(`Total products: ${totalProducts}`);
  console.log(`Already marked isNewArrival=true: ${alreadyTrue}`);
  console.log(`Will be updated: ${totalProducts - alreadyTrue}`);

  // Step 2: only proceed if run with --confirm, so a plain run is a dry preview.
  const shouldApply = process.argv.includes("--confirm");

  if (!shouldApply) {
    console.log("\nDry run only — no changes made.");
    console.log("Re-run with: node bulkSetNewArrival.js --confirm");
    return;
  }

  const result = await prisma.product.updateMany({
    where: { isNewArrival: false },
    data: { isNewArrival: true },
  });

  console.log(`\nDone. Updated ${result.count} products to isNewArrival = true.`);
}

run()
  .catch((err) => {
    console.error("Script failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });