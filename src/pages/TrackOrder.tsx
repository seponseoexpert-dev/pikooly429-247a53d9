import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const trackingSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const getStepIndex = (status: string) => {
  if (status === "cancelled" || status === "returned") return -1;
  const idx = trackingSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

const TrackOrder = () => {
  const { formatPrice } = useMultiCurrency();
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    order: any;
    items: any[];
  } | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("Please enter your order number");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("track-order", {
        body: { order_number: orderNumber.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error === "Order not found" ? "Order not found. Please check the number." : data.error);
        return;
      }
      setResult(data);
    } catch {
      toast.error("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const order = result?.order;
  const items = result?.items || [];
  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === "cancelled" || order?.status === "returned";

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pt-8 pb-32">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Track Your Order</h1>
          <p className="text-sm text-muted-foreground">Enter your order number to see the latest status</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. PF-20260220-0974"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="pl-10 h-11 rounded-full"
            />
          </div>
          <Button type="submit" className="rounded-full h-11 px-6" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Track"}
          </Button>
        </form>

        <AnimatePresence mode="wait">
          {order && (
            <motion.div
              key={order.order_number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Order Number */}
              <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Order Number</p>
                <p className="text-lg font-mono font-bold text-primary">{order.order_number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Status Tracker */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-5">Order Status</h3>
                {isCancelled ? (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-xl">
                    <XCircle size={24} className="text-destructive" />
                    <div>
                      <p className="font-semibold text-sm capitalize">{order.status}</p>
                      <p className="text-xs text-muted-foreground">This order has been {order.status}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[15px] top-[15px] bottom-[15px] w-0.5 bg-border" />
                    <div
                      className="absolute left-[15px] top-[15px] w-0.5 bg-primary transition-all duration-500"
                      style={{ height: `${Math.max(0, currentStep) * 25}%` }}
                    />
                    <div className="space-y-5">
                      {trackingSteps.map((step, idx) => {
                        const isCompleted = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center gap-3 relative">
                            <div className={`z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-card" : ""}`}>
                              <StepIcon size={14} />
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                              {isCurrent && <p className="text-xs text-primary font-medium">Current status</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                  <div className="space-y-2.5">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(order.delivery_fee)}</span></div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{formatPrice(order.discount)}</span></div>
                    )}
                    <Separator className="my-1.5" />
                    <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div>
                  </div>
                </div>
              )}

              {/* Delivery Details */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">Delivery Details</h3>
                <div className="text-sm space-y-1.5 text-muted-foreground">
                  {order.recipient_name && <p><span className="font-medium text-foreground">Recipient:</span> {order.recipient_name}</p>}
                  <p><span className="font-medium text-foreground">Address:</span> {order.delivery_address}</p>
                  {order.delivery_date && <p><span className="font-medium text-foreground">Date:</span> {order.delivery_date}</p>}
                  {order.delivery_time && <p><span className="font-medium text-foreground">Time:</span> {order.delivery_time}</p>}
                  <p><span className="font-medium text-foreground">Payment:</span> {order.payment_method.toUpperCase()} — <span className="capitalize">{order.payment_status}</span></p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default TrackOrder;
