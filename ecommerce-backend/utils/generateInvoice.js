const path = require("path");
const PDFDocument = require("pdfkit");

const BLUE = "#2196f3";
const DARK_BLUE = "#1565c0";
const TEXT = "#1e293b";
const MUTED = "#64748b";

// logo.png = cropped icon + "J ELECTRONICS" wordmark (tagline strip removed).
// Place the file at <project-root>/assets/logo.png.
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const COMPANY = {
  phone: "+923176572690",
  addressLine1: "Citi Mall, Near Zavia School",
  addressLine2: "Gulgasht Colony, Multan",
  email: "jelectronics.store@gmail.com",
  phoneLabel: "03176572690",
};

const PAYMENT_INFO = {
  method: "Bank Transfer",
  bankName: "UBL (United Bank Limited)",
  accountDetails: "0346310890016",
  accountTitle: "Jalal Khan",
};

function formatMoney(n) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Draws the full invoice layout onto an already-created PDFDocument.
 * Shared by both the streaming (download route) and buffer (email
 * attachment) code paths below, so the layout only lives in one place.
 * @param {PDFKit.PDFDocument} doc
 * @param {object} order - order with items[] attached
 * @param {object} customer - { name, email }
 */
function drawInvoice(doc, order, customer) {
  const pageWidth = doc.page.width;
  const margin = 48;

  // ---- Top blue banner ----
  doc.rect(0, 0, pageWidth, 28).fill(BLUE);

  // ---- Logo (icon + wordmark, from the real logo file) ----
  const logoY = 45;
  const logoWidth = 130; // scaled proportionally by pdfkit from the source aspect ratio
  try {
    doc.image(LOGO_PATH, margin, logoY, { width: logoWidth });
  } catch (err) {
    // Falls back to no logo rather than crashing invoice generation if the
    // asset is ever missing — logs so it's easy to notice in deploy logs.
    console.error("Invoice logo not found at", LOGO_PATH, err.message);
  }

  doc
    .fillColor(BLUE)
    .font("Helvetica")
    .fontSize(11)
    .text(`\u260E  ${COMPANY.phone}`, margin, logoY + 108);

  // ---- Diagonal accent shape (top right) ----
  doc
    .polygon([pageWidth - 220, 28], [pageWidth, 28], [pageWidth, 100], [pageWidth - 160, 100])
    .fill(BLUE);

  // ---- INVOICE title ----
  doc
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("INVOICE", 0, 150, { align: "center" });

  // ---- Company + date block ----
  let y = 210;
  doc.fillColor(TEXT).font("Helvetica").fontSize(11);
  doc.text("J Electronics", margin, y);
  y += 18;
  doc.font("Helvetica-Bold").text("Address: ", margin, y, { continued: true });
  doc.font("Helvetica").text(`, ${COMPANY.addressLine1}`);
  y += 15;
  doc.text(COMPANY.addressLine2, margin, y);
  y += 22;
  doc.font("Helvetica-Bold").text("Email: ", margin, y, { continued: true });
  doc.font("Helvetica").text(COMPANY.email);
  y += 18;
  doc.font("Helvetica-Bold").text("Phone: ", margin, y, { continued: true });
  doc.font("Helvetica").text(COMPANY.phoneLabel);

  // Date, right-aligned
  const dateLabel = `Date: ${formatDate(order.createdAt || Date.now())}`;
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(dateLabel, pageWidth - margin - 200, 210, { width: 200, align: "right", underline: true });

  // ---- Bill To ----
  y += 40;
  doc.font("Helvetica").fontSize(11).text("Bill To", margin, y);
  y += 16;
  doc.font("Helvetica-Bold").fontSize(12).text(customer.name || customer.email, margin, y);

  // ---- Items table ----
  y += 40;
  const tableTop = y;
  const colX = {
    desc: margin,
    price: margin + 220,
    qty: margin + 340,
    amount: margin + 440,
  };
  const tableWidth = pageWidth - margin * 2;

  doc.rect(margin, tableTop, tableWidth, 26).fill(BLUE);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
  doc.text("Description", colX.desc + 10, tableTop + 7);
  doc.text("Price", colX.price, tableTop + 7);
  doc.text("Quantity", colX.qty, tableTop + 7);
  doc.text("Amount", colX.amount, tableTop + 7, { width: pageWidth - margin - colX.amount, align: "right" });

  let rowY = tableTop + 26 + 10;
  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10.5);

  order.items.forEach((item) => {
    const lineAmount = item.priceAtOrder * item.quantity;

    doc.text(`\u2022 ${item.itemName}`, colX.desc + 10, rowY, { width: colX.price - colX.desc - 20 });
    doc.text(formatMoney(item.priceAtOrder), colX.price, rowY);
    doc.text(`${item.quantity} pcs`, colX.qty, rowY);
    doc.text(formatMoney(lineAmount), colX.amount, rowY, {
      width: pageWidth - margin - colX.amount,
      align: "right",
    });

    rowY += 24;
  });

  // ---- Payment info + totals ----
  const paymentY = rowY + 50;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text("Payment Information", margin, paymentY);

  doc.font("Helvetica").fontSize(10.5).fillColor(TEXT);
  let py = paymentY + 20;
  doc.text(`Payment Method:  ${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}`, margin, py);
  py += 16;
  doc.text(`Bank Name:  ${PAYMENT_INFO.bankName}`, margin, py);
  py += 16;
  doc.text(`Account Details: ${PAYMENT_INFO.accountDetails}`, margin, py);
  py += 16;
  doc.text(`Account Title: ${PAYMENT_INFO.accountTitle}`, margin, py);

  // Totals, right side
  const totalsX = pageWidth - margin - 220;
  let ty = paymentY;
  doc.font("Helvetica").fontSize(11).fillColor(MUTED);
  doc.text("Subtotal", totalsX, ty, { width: 130, align: "left" });
  doc.fillColor(TEXT).text(formatMoney(order.subtotal), totalsX, ty, { width: 220, align: "right" });
  ty += 18;
  doc.fillColor(MUTED).text("Shipping", totalsX, ty, { width: 130, align: "left" });
  doc.fillColor(TEXT).text(formatMoney(order.shippingCost), totalsX, ty, { width: 220, align: "right" });
  ty += 18;
  doc.fillColor(MUTED).text("Tax", totalsX, ty, { width: 130, align: "left" });
  doc.fillColor(TEXT).text(formatMoney(order.taxAmount), totalsX, ty, { width: 220, align: "right" });
  ty += 24;

  doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT);
  doc.text("Total", totalsX, ty);
  doc.text(formatMoney(order.total), totalsX, ty, { width: 220, align: "right" });

  // ---- Bottom blue banner ----
  const pageHeight = doc.page.height;
  doc.rect(0, pageHeight - 40, pageWidth, 40).fill(DARK_BLUE);
}

/**
 * Streams an invoice PDF directly to an Express response (download route).
 * @param {object} order
 * @param {object} customer - { name, email }
 * @param {import('http').ServerResponse} res
 */
function generateInvoicePdf(order, customer, res) {
  const doc = new PDFDocument({ size: "A4", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.id}.pdf"`);
  doc.pipe(res);

  drawInvoice(doc, order, customer);
  doc.end();
}

/**
 * Renders an invoice PDF into memory and resolves with a Buffer — used for
 * attaching the invoice to the order confirmation email (Brevo attachments
 * need base64 content, not a live response stream).
 * @param {object} order
 * @param {object} customer - { name, email }
 * @returns {Promise<Buffer>}
 */
function renderInvoicePdfBuffer(order, customer) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawInvoice(doc, order, customer);
    doc.end();
  });
}

module.exports = { generateInvoicePdf, renderInvoicePdfBuffer };