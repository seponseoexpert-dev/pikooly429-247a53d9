// Premium email template builder for order emails

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

const S = {
  font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  bg: "#f4f1ec",
  card: "#ffffff",
  primary: "#2d5016",
  primaryLight: "#3d6b22",
  gold: "#c8a951",
  goldLight: "#e8d48b",
  dark: "#1a1a1a",
  mid: "#3d3d3d",
  light: "#727272",
  muted: "#a0a0a0",
  border: "#e8e5df",
  borderLight: "#f2f0ec",
  cream: "#faf8f4",
  warmGray: "#f7f5f1",
};

function itemRow(item: { name: string; quantity: number; total: number; imageUrl?: string }) {
  const img = item.imageUrl
    ? `<img src="${item.imageUrl}" alt="${item.name}" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:block;" />`
    : `<div style="width:64px;height:64px;background:${S.cream};border-radius:8px;"></div>`;
  return `<tr>
    <td style="padding:16px 0;border-bottom:1px solid ${S.borderLight};vertical-align:middle;width:64px;">${img}</td>
    <td style="padding:16px 14px;border-bottom:1px solid ${S.borderLight};vertical-align:middle;">
      <p style="margin:0;font-size:14px;font-weight:600;color:${S.dark};line-height:1.5;letter-spacing:-0.2px;">${item.name}</p>
      <p style="margin:4px 0 0;font-size:12px;color:${S.muted};letter-spacing:0.3px;">Qty: ${item.quantity}</p>
    </td>
    <td style="padding:16px 0;border-bottom:1px solid ${S.borderLight};text-align:right;vertical-align:middle;font-size:15px;font-weight:700;color:${S.dark};white-space:nowrap;letter-spacing:-0.3px;">৳${Number(item.total).toFixed(2)}</td>
  </tr>`;
}

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PikoolyFlora</title></head>
<body style="margin:0;padding:0;background-color:${S.bg};font-family:${S.font};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${S.bg};padding:48px 16px;">
    <tr><td align="center">
      <!-- Pre-header spacer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 16px;text-align:center;">
          <p style="margin:0;font-size:10px;color:${S.muted};letter-spacing:2px;text-transform:uppercase;">ORDER NOTIFICATION</p>
        </td></tr>
      </table>
      <!-- Main Card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${S.card};border-radius:16px;overflow:hidden;border:1px solid ${S.border};">
        ${content}
      </table>
      <!-- Footer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;color:${S.primary};letter-spacing:0.5px;">Pikooly<span style="color:${S.gold};">Flora</span></p>
          <p style="margin:8px 0 0;font-size:11px;color:${S.muted};line-height:1.6;">© ${new Date().getFullYear()} PikoolyFlora. All rights reserved.<br/>This is an automated email. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function header(storeName = "PikoolyFlora", tagline = "NOT JUST A GIFT, IT'S SHARING OF LOVE") {
  return `<!-- Header -->
  <tr><td style="background:${S.primary};padding:44px 40px 40px;text-align:center;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="text-align:center;">
        <!-- Gold line accent -->
        <div style="width:40px;height:2px;background:${S.gold};margin:0 auto 20px;"></div>
        <h1 style="margin:0;font-size:32px;font-weight:300;color:#ffffff;letter-spacing:2px;">Pikooly<span style="font-weight:700;color:${S.gold};">Flora</span></h1>
        <p style="margin:14px 0 0;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:3.5px;text-transform:uppercase;font-weight:400;">${tagline}</p>
        <div style="width:40px;height:2px;background:${S.gold};margin:20px auto 0;"></div>
      </td></tr>
    </table>
  </td></tr>`;
}

function statusIcon(emoji: string, heading: string, color: string, subtitle?: string) {
  return `<!-- Status -->
  <tr><td style="padding:40px 40px 0;text-align:center;">
    <div style="width:72px;height:72px;margin:0 auto;border-radius:50%;border:2px solid ${color}30;line-height:72px;font-size:32px;">${emoji}</div>
    <h2 style="margin:20px 0 0;font-size:22px;font-weight:700;color:${S.dark};letter-spacing:-0.5px;">${heading}</h2>
    ${subtitle ? `<p style="margin:8px 0 0;font-size:14px;color:${S.light};line-height:1.6;">${subtitle}</p>` : ""}
  </td></tr>`;
}

function greeting(name: string, message: string) {
  return `<!-- Greeting -->
  <tr><td style="padding:28px 40px 0;">
    <p style="margin:0;font-size:15px;color:${S.mid};line-height:1.7;">Hi <strong style="color:${S.dark};font-weight:700;">${name}</strong>,</p>
    <p style="margin:8px 0 0;font-size:14px;color:${S.light};line-height:1.8;">${message}</p>
  </td></tr>`;
}

function infoCard(title: string, rows: { label: string; value: string; bold?: boolean; color?: string }[], accent = S.primary) {
  const rowsHtml = rows
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 12px 8px 0;font-size:12px;color:${S.light};white-space:nowrap;vertical-align:top;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">${r.label}</td>
          <td style="padding:8px 0;font-size:14px;${r.bold ? "font-weight:700;" : "font-weight:500;"}color:${r.color || S.dark};word-break:break-word;">${r.value}</td>
        </tr>`
    )
    .join("");

  return `<!-- Info Card -->
  <tr><td style="padding:28px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${S.cream};border-radius:12px;overflow:hidden;border-left:3px solid ${accent};">
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1.5px;">${title}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:auto;">
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
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:${S.primary};text-transform:uppercase;letter-spacing:1.5px;">Order Items</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${items.map(itemRow).join("")}
    </table>
  </td></tr>`;
}

function totalsBlock(subtotal: number, deliveryFee: number, discount: number, couponCode: string | undefined, total: number) {
  const discountRow = discount > 0
    ? `<tr>
        <td style="padding:6px 0;font-size:13px;color:${S.light};">Discount ${couponCode ? `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;margin-left:6px;letter-spacing:0.5px;">${couponCode}</span>` : ""}</td>
        <td style="padding:6px 0;font-size:14px;color:#dc2626;font-weight:600;text-align:right;">-৳${discount.toFixed(2)}</td>
       </tr>`
    : "";

  return `<!-- Totals -->
  <tr><td style="padding:28px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${S.cream};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:24px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:13px;color:${S.light};">Subtotal</td><td style="padding:6px 0;font-size:14px;color:${S.dark};font-weight:500;text-align:right;">৳${subtotal.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:${S.light};">Delivery</td><td style="padding:6px 0;font-size:14px;color:${S.dark};font-weight:500;text-align:right;">৳${deliveryFee.toFixed(2)}</td></tr>
          ${discountRow}
          <tr><td colspan="2" style="padding:14px 0 0;"><div style="border-top:1px solid ${S.border};"></div></td></tr>
          <tr>
            <td style="padding:16px 0 0;font-size:18px;font-weight:800;color:${S.dark};letter-spacing:-0.5px;">Total</td>
            <td style="padding:16px 0 0;font-size:20px;font-weight:800;color:${S.primary};text-align:right;letter-spacing:-0.5px;">৳${total.toFixed(2)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>`;
}

function ctaButton(url: string, text: string, color = S.primary) {
  return `<!-- CTA -->
  <tr><td style="padding:8px 40px 40px;text-align:center;">
    <a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:16px 48px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.8px;text-transform:uppercase;">${text}</a>
  </td></tr>`;
}

function noteBlock(note: string, label = "📝 Note") {
  return `<tr><td style="padding:0 40px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-radius:10px;border-left:3px solid ${S.gold};">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0;font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">${label}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">${note}</p>
      </td></tr>
    </table>
  </td></tr>`;
}

function goldDivider() {
  return `<tr><td style="padding:0 40px;"><div style="width:32px;height:2px;background:${S.gold};margin:0 auto;"></div></td></tr>`;
}

// ============= PUBLIC API =============

export function buildOrderConfirmationEmail(data: OrderEmailData): string {
  const content = [
    header(data.storeName, data.tagline),
    statusIcon("✓", "Order Confirmed", "#16a34a"),
    greeting(
      data.customerName,
      "Thank you for your order! We've received it and it's now being prepared with care. You'll receive updates as it progresses."
    ),
    goldDivider(),
    infoCard("Order Details", [
      { label: "Order No.", value: data.orderNumber, bold: true, color: S.primary },
      { label: "Recipient", value: data.recipientName || data.customerName, bold: true },
      { label: "Address", value: data.deliveryAddress },
      { label: "Delivery", value: [data.deliveryDate, data.deliveryTime].filter(Boolean).join(" · ") || "" },
      { label: "Payment", value: data.paymentMethod || "" },
    ]),
    itemsTable(data.items),
    totalsBlock(data.subtotal, data.deliveryFee, data.discount || 0, data.couponCode, data.total),
    data.note ? noteBlock(data.note) : "",
    ctaButton(data.trackOrderUrl, "Track Your Order →"),
  ].join("");

  return wrap(content);
}

export function buildStatusUpdateEmail(data: StatusEmailData): string {
  const content = [
    header(data.storeName, data.tagline),
    statusIcon(data.statusEmoji, data.statusHeading, data.statusColor),
    greeting(data.customerName, data.statusMessage),
    goldDivider(),
    infoCard("Order Summary", [
      { label: "Order No.", value: data.orderNumber, bold: true, color: S.primary },
      { label: "Status", value: data.status.charAt(0).toUpperCase() + data.status.slice(1), bold: true, color: data.statusColor },
      { label: "Total", value: `৳${data.total.toFixed(2)}`, bold: true },
      { label: "Address", value: data.deliveryAddress },
    ]),
    itemsTable(data.items),
    ctaButton(data.trackOrderUrl, "Track Your Order →"),
  ].join("");

  return wrap(content);
}

export function buildAdminNewOrderEmail(data: OrderEmailData & { customerPhone?: string; customerEmail?: string; billingCountry?: string }): string {
  const content = [
    header(data.storeName, data.tagline),
    statusIcon("🛒", "New Order Received", "#2563eb", `from <strong>${data.customerName}</strong>`),
    goldDivider(),
    infoCard("Customer", [
      { label: "Order No.", value: data.orderNumber, bold: true, color: S.primary },
      { label: "Name", value: data.customerName, bold: true },
      { label: "Phone", value: data.customerPhone || "" },
      { label: "Email", value: data.customerEmail || "" },
      { label: "Country", value: data.billingCountry || "" },
    ]),
    infoCard("Delivery", [
      { label: "Recipient", value: data.recipientName || data.customerName, bold: true },
      { label: "Address", value: data.deliveryAddress },
      { label: "Date", value: data.deliveryDate || "" },
      { label: "Time", value: data.deliveryTime || "" },
      { label: "Payment", value: data.paymentMethod || "N/A", bold: true },
    ], "#2563eb"),
    itemsTable(data.items),
    totalsBlock(data.subtotal, data.deliveryFee, data.discount || 0, data.couponCode, data.total),
    data.note ? noteBlock(data.note, "📝 Customer Note") : "",
    `<tr><td style="padding:0 40px 8px;text-align:center;">
      <p style="margin:0;font-size:12px;color:${S.light};">Congratulations on the sale! 🎉</p>
    </td></tr>`,
    ctaButton(data.trackOrderUrl, "Manage Order →", "#2563eb"),
  ].join("");

  return wrap(content);
}
