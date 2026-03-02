// Shared email template builder for order emails

interface OrderEmailData {
  storeName?: string;
  tagline?: string;
  customerName: string;
  orderNumber: string;
  deliveryAddress: string;
  deliveryDate?: string;
  deliveryTime?: string;
  recipientName?: string;
  paymentMethod?: string;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  couponCode?: string;
  total: number;
  items: { name: string; quantity: number; total: number; imageUrl?: string }[];
  trackOrderUrl: string;
  note?: string;
}

interface StatusEmailData extends OrderEmailData {
  status: string;
  statusHeading: string;
  statusMessage: string;
  statusEmoji: string;
  statusColor: string;
}

const baseStyles = {
  fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  bgOuter: "#f0f2f5",
  bgCard: "#ffffff",
  primary: "#4a7c59",
  primaryLight: "#6b9f5c",
  gold: "#d4a853",
  textDark: "#1a1a2e",
  textMid: "#444654",
  textLight: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  successBg: "#ecfdf5",
  successText: "#059669",
};

function itemRow(item: { name: string; quantity: number; total: number; imageUrl?: string }) {
  const img = item.imageUrl
    ? `<img src="${item.imageUrl}" alt="${item.name}" width="52" height="52" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block;border:1px solid #f0f0f0;" />`
    : `<div style="width:52px;height:52px;background:linear-gradient(135deg,#f0f0f0,#e8e8e8);border-radius:10px;"></div>`;
  return `<tr>
    <td style="padding:14px 16px;border-bottom:1px solid ${baseStyles.borderLight};vertical-align:middle;width:52px;">${img}</td>
    <td style="padding:14px 12px;border-bottom:1px solid ${baseStyles.borderLight};vertical-align:middle;">
      <p style="margin:0;font-size:14px;font-weight:600;color:${baseStyles.textDark};line-height:1.4;">${item.name}</p>
      <p style="margin:3px 0 0;font-size:12px;color:${baseStyles.textLight};">Qty: ${item.quantity}</p>
    </td>
    <td style="padding:14px 16px;border-bottom:1px solid ${baseStyles.borderLight};text-align:right;vertical-align:middle;font-size:14px;font-weight:700;color:${baseStyles.textDark};white-space:nowrap;">৳${Number(item.total).toFixed(2)}</td>
  </tr>`;
}

function wrapEmail(content: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PikoolyFlora</title></head>
<body style="margin:0;padding:0;background-color:${baseStyles.bgOuter};font-family:${baseStyles.fontFamily};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${baseStyles.bgOuter};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${baseStyles.bgCard};border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
        ${content}
      </table>
      <!-- Footer outside card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${baseStyles.textMuted};">© ${new Date().getFullYear()} PikoolyFlora. All rights reserved.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#c0c0c0;">This is an automated email. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function headerBlock(storeName = "PikoolyFlora", tagline = "NOT JUST A GIFT, IT'S SHARING OF LOVE") {
  return `<!-- Header -->
  <tr><td style="background:linear-gradient(135deg,${baseStyles.primary} 0%,${baseStyles.primaryLight} 50%,${baseStyles.primary} 100%);padding:36px 40px;text-align:center;">
    <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">Pikooly<span style="color:${baseStyles.gold};">Flora</span></h1>
    <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:500;">${tagline}</p>
  </td></tr>`;
}

function statusBadge(emoji: string, heading: string, color: string) {
  return `<!-- Status Badge -->
  <tr><td style="padding:36px 40px 8px;text-align:center;">
    <div style="width:76px;height:76px;margin:0 auto;background:${color}12;border-radius:50%;line-height:76px;font-size:38px;border:3px solid ${color}25;">${emoji}</div>
    <h2 style="margin:18px 0 0;font-size:24px;font-weight:800;color:${color};letter-spacing:-0.3px;">${heading}</h2>
  </td></tr>`;
}

function greetingBlock(name: string, message: string) {
  return `<!-- Greeting -->
  <tr><td style="padding:20px 40px 0;">
    <p style="margin:0;font-size:15px;color:${baseStyles.textMid};line-height:1.7;">Hi <strong style="color:${baseStyles.textDark};">${name}</strong>,</p>
    <p style="margin:8px 0 0;font-size:15px;color:${baseStyles.textLight};line-height:1.7;">${message}</p>
  </td></tr>`;
}

function infoCard(rows: { label: string; value: string; bold?: boolean; color?: string }[]) {
  const rowsHtml = rows
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 0;font-size:13px;color:${baseStyles.textLight};width:140px;vertical-align:top;">${r.label}</td>
          <td style="padding:8px 0;font-size:14px;${r.bold ? "font-weight:700;" : "font-weight:500;"}color:${r.color || baseStyles.textDark};">${r.value}</td>
        </tr>`
    )
    .join("");

  return `<!-- Info Card -->
  <tr><td style="padding:24px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f8faf8,#f5f7f5);border:1px solid #e8efe8;border-radius:14px;overflow:hidden;">
      <tr><td style="padding:22px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rowsHtml}
        </table>
      </td></tr>
    </table>
  </td></tr>`;
}

function itemsTable(items: { name: string; quantity: number; total: number; imageUrl?: string }[]) {
  if (!items.length) return "";
  return `<!-- Items -->
  <tr><td style="padding:0 40px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${baseStyles.textDark};text-transform:uppercase;letter-spacing:0.8px;">Order Items</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;border:1px solid ${baseStyles.border};">
      <thead><tr style="background:linear-gradient(135deg,#fafbfc,#f5f6f8);">
        <th colspan="2" style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:${baseStyles.textLight};text-transform:uppercase;letter-spacing:1px;">Product</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:${baseStyles.textLight};text-transform:uppercase;letter-spacing:1px;">Price</th>
      </tr></thead>
      <tbody>${items.map(itemRow).join("")}</tbody>
    </table>
  </td></tr>`;
}

function totalsBlock(subtotal: number, deliveryFee: number, discount: number, couponCode: string | undefined, total: number) {
  const discountRow = discount > 0
    ? `<tr>
        <td style="padding:6px 0;font-size:14px;color:${baseStyles.textLight};">Discount ${couponCode ? `<span style="display:inline-block;background:${baseStyles.successBg};color:${baseStyles.successText};font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:4px;letter-spacing:0.3px;">${couponCode}</span>` : ""}</td>
        <td style="padding:6px 0;font-size:14px;color:#ef4444;font-weight:600;text-align:right;">-৳${discount.toFixed(2)}</td>
       </tr>`
    : "";

  return `<!-- Totals -->
  <tr><td style="padding:24px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;font-size:14px;color:${baseStyles.textLight};">Subtotal</td><td style="padding:6px 0;font-size:14px;color:${baseStyles.textDark};font-weight:500;text-align:right;">৳${subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:${baseStyles.textLight};">Delivery</td><td style="padding:6px 0;font-size:14px;color:${baseStyles.textDark};font-weight:500;text-align:right;">৳${deliveryFee.toFixed(2)}</td></tr>
      ${discountRow}
      <tr><td colspan="2" style="padding:14px 0 0;"><div style="border-top:2px solid ${baseStyles.border};"></div></td></tr>
      <tr>
        <td style="padding:14px 0 0;font-size:20px;font-weight:800;color:${baseStyles.textDark};">Total</td>
        <td style="padding:14px 0 0;font-size:20px;font-weight:800;color:${baseStyles.primary};text-align:right;">৳${total.toFixed(2)}</td>
      </tr>
    </table>
  </td></tr>`;
}

function ctaButton(url: string, text: string) {
  return `<!-- CTA -->
  <tr><td style="padding:8px 40px 36px;text-align:center;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${baseStyles.primary},${baseStyles.primaryLight});color:#fff;padding:16px 44px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(74,124,89,0.35);mso-padding-alt:16px 44px;">${text}</a>
  </td></tr>`;
}

function divider() {
  return `<tr><td style="padding:0 40px;"><div style="border-top:1px solid ${baseStyles.borderLight};"></div></td></tr>`;
}

// ============= PUBLIC API =============

export function buildOrderConfirmationEmail(data: OrderEmailData): string {
  const content = [
    headerBlock(data.storeName, data.tagline),
    statusBadge("✅", "Order Confirmed!", baseStyles.successText),
    greetingBlock(
      data.customerName,
      "We've received your order and it's being processed. You'll receive updates as your order progresses."
    ),
    infoCard([
      { label: "Order Number", value: data.orderNumber, bold: true },
      { label: "Recipient", value: data.recipientName || data.customerName, bold: true },
      { label: "Address", value: data.deliveryAddress },
      { label: "Delivery Date", value: data.deliveryDate || "" },
      { label: "Delivery Time", value: data.deliveryTime || "" },
      { label: "Payment", value: data.paymentMethod || "" },
    ]),
    itemsTable(data.items),
    totalsBlock(data.subtotal, data.deliveryFee, data.discount || 0, data.couponCode, data.total),
    data.note ? `<tr><td style="padding:0 40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">📝 Note</p>
          <p style="margin:6px 0 0;font-size:14px;color:#78350f;line-height:1.5;">${data.note}</p>
        </td></tr>
      </table>
    </td></tr>` : "",
    ctaButton(data.trackOrderUrl, "Track Your Order →"),
  ].join("");

  return wrapEmail(content);
}

export function buildStatusUpdateEmail(data: StatusEmailData): string {
  const content = [
    headerBlock(data.storeName, data.tagline),
    statusBadge(data.statusEmoji, data.statusHeading, data.statusColor),
    greetingBlock(data.customerName, data.statusMessage),
    infoCard([
      { label: "Order Number", value: data.orderNumber, bold: true },
      { label: "Status", value: data.status.charAt(0).toUpperCase() + data.status.slice(1), bold: true, color: data.statusColor },
      { label: "Total", value: `৳${data.total.toFixed(2)}`, bold: true },
      { label: "Address", value: data.deliveryAddress },
    ]),
    itemsTable(data.items),
    ctaButton(data.trackOrderUrl, "Track Your Order →"),
  ].join("");

  return wrapEmail(content);
}

export function buildAdminNewOrderEmail(data: OrderEmailData & { customerPhone?: string; customerEmail?: string; billingCountry?: string }): string {
  const content = [
    headerBlock(data.storeName, data.tagline),
    `<!-- Admin Alert -->
    <tr><td style="padding:36px 40px 8px;text-align:center;">
      <div style="width:76px;height:76px;margin:0 auto;background:#dbeafe;border-radius:50%;line-height:76px;font-size:38px;border:3px solid #93c5fd;">🛒</div>
      <h2 style="margin:18px 0 0;font-size:24px;font-weight:800;color:#1e40af;letter-spacing:-0.3px;">New Order Received!</h2>
      <p style="margin:8px 0 0;font-size:14px;color:${baseStyles.textLight};">from <strong style="color:${baseStyles.textDark};">${data.customerName}</strong></p>
    </td></tr>`,
    infoCard([
      { label: "Order Number", value: data.orderNumber, bold: true, color: baseStyles.primary },
      { label: "Customer", value: data.customerName, bold: true },
      { label: "Phone", value: data.customerPhone || "" },
      { label: "Email", value: data.customerEmail || "" },
      { label: "Country", value: data.billingCountry || "" },
    ]),
    `<!-- Delivery Info Card -->
    <tr><td style="padding:0 40px 20px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${baseStyles.textDark};text-transform:uppercase;letter-spacing:0.8px;">Delivery Information</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0f9ff,#eff6ff);border:1px solid #bfdbfe;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:22px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${data.recipientName ? `<tr><td style="padding:6px 0;font-size:13px;color:${baseStyles.textLight};width:140px;">Recipient</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${baseStyles.textDark};">${data.recipientName}</td></tr>` : ""}
            <tr><td style="padding:6px 0;font-size:13px;color:${baseStyles.textLight};width:140px;">Address</td><td style="padding:6px 0;font-size:14px;color:${baseStyles.textDark};">${data.deliveryAddress}</td></tr>
            ${data.deliveryDate ? `<tr><td style="padding:6px 0;font-size:13px;color:${baseStyles.textLight};">Date</td><td style="padding:6px 0;font-size:14px;color:${baseStyles.textDark};">${data.deliveryDate}</td></tr>` : ""}
            ${data.deliveryTime ? `<tr><td style="padding:6px 0;font-size:13px;color:${baseStyles.textLight};">Time</td><td style="padding:6px 0;font-size:14px;color:${baseStyles.textDark};">${data.deliveryTime}</td></tr>` : ""}
            <tr><td style="padding:6px 0;font-size:13px;color:${baseStyles.textLight};">Payment</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${baseStyles.textDark};">${data.paymentMethod || "N/A"}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`,
    itemsTable(data.items),
    totalsBlock(data.subtotal, data.deliveryFee, data.discount || 0, data.couponCode, data.total),
    data.note ? `<tr><td style="padding:0 40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">📝 Customer Note</p>
          <p style="margin:6px 0 0;font-size:14px;color:#78350f;line-height:1.5;">${data.note}</p>
        </td></tr>
      </table>
    </td></tr>` : "",
    `<!-- Admin CTA -->
    <tr><td style="padding:8px 40px 36px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;color:${baseStyles.textLight};">Congratulations on the sale! 🎉</p>
      <a href="${data.trackOrderUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:16px 44px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(30,64,175,0.3);">Manage Order →</a>
    </td></tr>`,
  ].join("");

  return wrapEmail(content);
}
