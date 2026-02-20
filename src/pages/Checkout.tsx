import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Truck, CreditCard, Minus, Plus, X } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const deliveryTimeSlots = [
  "09:00 AM - 01:00 PM",
  "01:00 PM - 05:00 PM",
  "05:00 PM - 09:00 PM",
];

const Checkout = () => {
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const { formatPrice } = useMultiCurrency();
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    billingCountry: "",
    phone: "",
    email: "",
    recipientName: "",
    recipientPhone: "",
    giftMessage: "",
    address: "",
    notes: "",
    deliveryDate: "",
    deliveryTime: "",
    paymentMethod: "cod",
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["shipping-districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_districts")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const activeDistrict = districts.find((d) => d.id === selectedDistrict);
  const deliveryFee = activeDistrict?.delivery_fee ?? 0;
  const grandTotal = totalPrice + deliveryFee;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.recipientName.trim() || !form.recipientPhone.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedDistrict) {
      toast.error("Please select a shipping district");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      const orderData = {
        customer_name: form.fullName.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        billing_country: form.billingCountry.trim() || 'Bangladesh',
        delivery_address: `${activeDistrict?.name || ""} - ${form.address.trim()}`,
        notes: form.notes.trim() || null,
        recipient_name: form.recipientName.trim() || null,
        alt_phone: form.recipientPhone.trim() || null,
        gift_message: form.giftMessage.trim() || null,
        delivery_date: form.deliveryDate || null,
        delivery_time: form.deliveryTime || null,
        payment_method: form.paymentMethod,
        subtotal: totalPrice,
        delivery_fee: deliveryFee,
        total: grandTotal,
        user_id: userId,
        order_number: "temp",
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id, order_number")
        .maybeSingle();

      if (orderError) {
        console.error("Order insert error:", orderError);
        throw orderError;
      }
      if (!order) throw new Error("Order was not created");

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast.success("Order placed successfully! 🎉");
      navigate(`/order-success/${order.order_number}`);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="section-container py-6 pb-24 md:pb-10">
        <div className="text-center py-20">
          <ShoppingBag size={64} className="mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add products to checkout</p>
          <Button onClick={() => navigate("/shop")} className="rounded-full">
            Go to Shop
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">YOUR ORDER</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Billing & Delivery */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Details */}
              {/* Billing Details */}
              <section className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Billing Details
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="fullName" placeholder="Enter your name" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className="mt-1.5" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="billingCountry">Country / Region <span className="text-destructive">*</span></Label>
                    <Input id="billingCountry" placeholder="Enter your country" value={form.billingCountry} onChange={(e) => handleChange("billingCountry", e.target.value)} className="mt-1.5" maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp Number <span className="text-destructive">*</span></Label>
                    <Input id="phone" type="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1.5" required maxLength={15} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1.5" maxLength={255} />
                  </div>
                </div>
              </section>

              {/* Delivery Information */}
              <section className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  Delivery Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name <span className="text-destructive">*</span></Label>
                    <Input id="recipientName" placeholder="Name of the person receiving the gift" value={form.recipientName} onChange={(e) => handleChange("recipientName", e.target.value)} className="mt-1.5" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">Recipient Number <span className="text-destructive">*</span></Label>
                    <Input id="recipientPhone" type="tel" placeholder="01XXXXXXXXX" value={form.recipientPhone} onChange={(e) => handleChange("recipientPhone", e.target.value)} className="mt-1.5" required maxLength={15} />
                  </div>
                  <div>
                    <Label>Country / Region</Label>
                    <div className="mt-1.5 px-3 py-2.5 bg-muted rounded-md text-sm font-medium">Bangladesh</div>
                  </div>
                  <div>
                    <Label htmlFor="address">Full Address <span className="text-destructive">*</span></Label>
                    <Input id="address" placeholder="House no, Street, Area" value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="mt-1.5" required maxLength={500} />
                  </div>
                  <div>
                    <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                    <Textarea id="giftMessage" placeholder="Write a special message for the recipient..." value={form.giftMessage} onChange={(e) => handleChange("giftMessage", e.target.value)} className="mt-1.5 min-h-[80px]" maxLength={500} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date (Optional)</Label>
                      <Input id="deliveryDate" type="date" value={form.deliveryDate} onChange={(e) => handleChange("deliveryDate", e.target.value)} className="mt-1.5" min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <Label>Delivery Time (Optional)</Label>
                      <Select value={form.deliveryTime} onValueChange={(v) => handleChange("deliveryTime", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent>
                          {deliveryTimeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-6">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
                    { value: "bkash", label: "bKash", desc: "bKash mobile payment" },
                    { value: "nagad", label: "Nagad", desc: "Nagad mobile payment" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentMethod === method.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input type="radio" name="paymentMethod" value={method.value} checked={form.paymentMethod === method.value} onChange={(e) => handleChange("paymentMethod", e.target.value)} className="accent-primary w-4 h-4" />
                      <div>
                        <p className="font-semibold text-sm">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 border border-border sticky top-28">
                <h2 className="text-sm font-bold mb-4 uppercase tracking-wide">Product</h2>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 items-start">
                      <img src={(item.product as any).image_url || item.product.image} alt={item.product.name} className="w-14 h-14 object-cover rounded-lg bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button type="button" onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                          <div className="flex items-center border rounded-full">
                            <button type="button" onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus size={12} /></button>
                            <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus size={12} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                <Separator className="my-4" />

                {/* Shipping District */}
                <div>
                  <Label className="text-sm font-semibold">
                    Shipping District <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {activeDistrict && (
                    <div className="mt-2 flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{activeDistrict.delivery_label}</span>
                      <span className="font-medium">{formatPrice(activeDistrict.delivery_fee)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>

                <Button type="submit" className="w-full mt-6 rounded-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Processing...</>
                  ) : (
                    `Place Order — ${formatPrice(grandTotal)}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
