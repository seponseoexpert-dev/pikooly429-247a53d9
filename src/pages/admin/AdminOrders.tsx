import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Search, Eye, Package } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const paymentStatusOptions = ["unpaid", "paid", "refunded"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  unpaid: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
};

const AdminOrders = () => {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
    setDetailOpen(true);
  };

  const statusEmailTemplates: Record<string, { subject: string; heading: string; message: string; emoji: string; color: string }> = {
    confirmed: {
      subject: "Order Confirmed",
      heading: "Your Order is Confirmed! ✅",
      message: "Great news! Your order has been confirmed and is now being prepared with care.",
      emoji: "✅",
      color: "#3b82f6",
    },
    processing: {
      subject: "Order Being Processed",
      heading: "Your Order is Being Prepared! 🔧",
      message: "We're currently preparing your order with love and care.",
      emoji: "🔧",
      color: "#8b5cf6",
    },
    shipped: {
      subject: "Order Shipped",
      heading: "Your Order is On The Way! 🚚",
      message: "Your order has been shipped and is on its way to the delivery address.",
      emoji: "🚚",
      color: "#06b6d4",
    },
    delivered: {
      subject: "Order Delivered",
      heading: "Order Successfully Delivered! 🎉",
      message: "Your order has been successfully delivered. We hope you love it!",
      emoji: "🎉",
      color: "#22c55e",
    },
    cancelled: {
      subject: "Order Cancelled",
      heading: "Order Cancelled ❌",
      message: "Your order has been cancelled. If you have any questions, please contact us.",
      emoji: "❌",
      color: "#ef4444",
    },
  };

  const sendStatusEmail = async (order: Order, newStatus: string) => {
    if (!order.customer_email) return;
    const template = statusEmailTemplates[newStatus];
    if (!template) return;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.customer_email,
          subject: `${template.subject} - ${order.order_number} | PikoolyFlora`,
          html: `
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
                <tr><td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    
                    <!-- Header -->
                    <tr><td style="background:linear-gradient(135deg,#4a7c59 0%,#6b9f5c 100%);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Pikooly<span style="color:#ffd700;">Flora</span></h1>
                      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:1px;">NOT JUST A GIFT, IT'S SHARING OF LOVE</p>
                    </td></tr>

                    <!-- Status Icon -->
                    <tr><td style="padding:32px 40px 0;text-align:center;">
                      <div style="width:72px;height:72px;margin:0 auto;background:${template.color}15;border-radius:50%;line-height:72px;font-size:36px;">${template.emoji}</div>
                      <h2 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:${template.color};">${template.heading}</h2>
                    </td></tr>

                    <!-- Message -->
                    <tr><td style="padding:24px 40px 0;">
                      <p style="margin:0;font-size:15px;color:#444;line-height:1.6;">Hi <strong style="color:#333;">${order.customer_name}</strong>,</p>
                      <p style="margin:8px 0 0;font-size:15px;color:#555;line-height:1.6;">${template.message}</p>
                    </td></tr>

                    <!-- Order Info Card -->
                    <tr><td style="padding:24px 40px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf8;border:1px solid #e8efe8;border-radius:12px;overflow:hidden;">
                        <tr><td style="padding:20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr><td style="padding:6px 0;font-size:14px;color:#888;width:140px;">Order Number</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#333;">${order.order_number}</td></tr>
                            <tr><td style="padding:6px 0;font-size:14px;color:#888;">Status</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:${template.color};text-transform:capitalize;">${newStatus}</td></tr>
                            <tr><td style="padding:6px 0;font-size:14px;color:#888;">Total</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#333;">৳${Number(order.total).toFixed(2)}</td></tr>
                            <tr><td style="padding:6px 0;font-size:14px;color:#888;">Delivery Address</td><td style="padding:6px 0;font-size:14px;color:#333;">${order.delivery_address}</td></tr>
                          </table>
                        </td></tr>
                      </table>
                    </td></tr>

                    <!-- CTA -->
                    <tr><td style="padding:0 40px 32px;text-align:center;">
                      <a href="${window.location.origin}/track-order" style="display:inline-block;background:linear-gradient(135deg,#4a7c59,#6b9f5c);color:#fff;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(74,124,89,0.3);">Track Your Order</a>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
                      <p style="margin:0;font-size:12px;color:#aaa;">PikoolyFlora — Not just a Gift, It's sharing of Love.</p>
                      <p style="margin:8px 0 0;font-size:11px;color:#ccc;">This is an automated email. Please do not reply.</p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body></html>
          `,
        },
      });
    } catch (err) {
      console.error("Failed to send status email:", err);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const order = orders.find((o) => o.id === orderId);
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Status updated" });
      // Send email notification
      if (order) sendStatusEmail(order, status);
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const updatePaymentStatus = async (orderId: string, payment_status: string) => {
    const { error } = await supabase.from("orders").update({ payment_status }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Payment status updated" });
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, payment_status });
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">Orders</h2>
        <Badge variant="outline" className="text-sm">{orders.length} total</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order #, name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /><div className="h-4 flex-1 bg-muted rounded animate-pulse" /><div className="h-5 w-16 bg-muted rounded-full animate-pulse" /><div className="h-4 w-20 bg-muted rounded animate-pulse" /></div>)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{order.order_number}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-muted"}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[order.payment_status] || "bg-muted"}`}>
                          {order.payment_status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Billing Details</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-muted-foreground">WhatsApp:</span> {selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</p>}
                  {(selectedOrder as any).billing_country && <p><span className="text-muted-foreground">Country:</span> {(selectedOrder as any).billing_country}</p>}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Delivery Information</h4>
                <div className="text-sm space-y-1">
                  {selectedOrder.recipient_name && <p><span className="text-muted-foreground">Recipient:</span> {selectedOrder.recipient_name}</p>}
                  {selectedOrder.alt_phone && <p><span className="text-muted-foreground">Recipient Phone:</span> {selectedOrder.alt_phone}</p>}
                  <p><span className="text-muted-foreground">Address:</span> {selectedOrder.delivery_address}</p>
                  {selectedOrder.delivery_date && <p><span className="text-muted-foreground">Delivery Date:</span> {selectedOrder.delivery_date}</p>}
                  {selectedOrder.delivery_time && <p><span className="text-muted-foreground">Delivery Time:</span> {selectedOrder.delivery_time}</p>}
                  {selectedOrder.gift_message && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Gift Message:</p>
                      <p className="text-sm italic">{selectedOrder.gift_message}</p>
                    </div>
                  )}
                  {selectedOrder.notes && (() => {
                    let displayNotes = selectedOrder.notes;
                    try {
                      const parsed = JSON.parse(selectedOrder.notes);
                      if (parsed.original_notes) displayNotes = parsed.original_notes;
                      else if (parsed.eps_merchant_transaction_id) displayNotes = null;
                    } catch {}
                    return displayNotes ? <p className="mt-1"><span className="text-muted-foreground">Notes:</span> {displayNotes}</p> : null;
                  })()}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                {orderItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                        {(item as any).custom_images?.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {(item as any).custom_images.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Custom ${i + 1}`} className="w-12 h-12 rounded object-cover border border-border hover:ring-2 ring-primary" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{formatCurrency(selectedOrder.delivery_fee)}</span></div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{formatCurrency(selectedOrder.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
              </div>

              <Separator />

              {/* Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Status</label>
                  <Select value={selectedOrder.status} onValueChange={(v) => updateStatus(selectedOrder.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={selectedOrder.payment_status} onValueChange={(v) => updatePaymentStatus(selectedOrder.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
