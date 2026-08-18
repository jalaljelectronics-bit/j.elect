const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
});

function formatOrderEmailHtml(order) {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${item.itemName} × ${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">Rs ${(item.priceAtOrder * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#3b5a80;">Thanks for your order!</h2>
      <p>Hi, your order <strong>#${order.id}</strong> has been placed successfully.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${itemRows}
      </table>

      <table style="width:100%;font-size:14px;">
        <tr><td>Subtotal</td><td style="text-align:right;">Rs ${order.subtotal.toLocaleString()}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">Rs ${order.shippingCost.toLocaleString()}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">Rs ${order.taxAmount.toLocaleString()}</td></tr>
        <tr style="font-weight:bold;"><td style="padding-top:8px;">Total</td><td style="text-align:right;padding-top:8px;">Rs ${order.total.toLocaleString()}</td></tr>
      </table>

      <p style="margin-top:24px;font-size:14px;color:#475569;">
        <strong>Shipping to:</strong> ${order.shippingAddress}<br/>
        <strong>Method:</strong> ${order.shippingMethod}<br/>
        <strong>Payment:</strong> ${order.paymentMethod}
      </p>

      <p style="margin-top:24px;font-size:13px;color:#94a3b8;">
        We'll notify you again once your order ships. Questions? Reply to this email or contact us at support@visiongiants.pk.
      </p>
    </div>
  `;
}

function formatAdminNotificationHtml(order, customerEmail) {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${item.itemName} × ${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">Rs ${(item.priceAtOrder * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#3b5a80;">New order placed 🎉</h2>
      <p><strong>Order #${order.id}</strong> from <strong>${customerEmail}</strong></p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${itemRows}
      </table>

      <table style="width:100%;font-size:14px;">
        <tr><td>Subtotal</td><td style="text-align:right;">Rs ${order.subtotal.toLocaleString()}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">Rs ${order.shippingCost.toLocaleString()}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">Rs ${order.taxAmount.toLocaleString()}</td></tr>
        <tr style="font-weight:bold;"><td style="padding-top:8px;">Total</td><td style="text-align:right;padding-top:8px;">Rs ${order.total.toLocaleString()}</td></tr>
      </table>

      <p style="margin-top:24px;font-size:14px;color:#475569;">
        <strong>Ship to:</strong> ${order.shippingAddress}<br/>
        <strong>Method:</strong> ${order.shippingMethod}<br/>
        <strong>Payment:</strong> ${order.paymentMethod}
        ${order.notes ? `<br/><strong>Customer notes:</strong> ${order.notes}` : ''}
      </p>
    </div>
  `;
}

exports.sendOrderConfirmation = async (order, userEmail) => {
  try {
    await transporter.sendMail({
      from: `"Jelectronics" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmed — #${order.id}`,
      html: formatOrderEmailHtml(order),
    });
  } catch (error) {
    // Never let an email failure break the order itself — it already
    // succeeded in the DB by the time this runs, so just log it.
    console.error("Failed to send order confirmation email:", error);
  }
};

exports.sendAdminOrderNotification = async (order, customerEmail) => {
  try {
    await transporter.sendMail({
      from: `"Jelectronics" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🛒 New Order #${order.id} — Rs ${order.total.toLocaleString()}`,
      html: formatAdminNotificationHtml(order, customerEmail),
    });
  } catch (error) {
    // Same reasoning as above — an admin-notification failure should
    // never affect the order or the customer's confirmation email.
    console.error("Failed to send admin order notification:", error);
  }
};