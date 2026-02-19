import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Truck, CreditCard } from "lucide-react";

const deliveryTimeSlots = [
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
];

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    deliveryDate: "",
    deliveryTime: "",
    paymentMethod: "cod",
  });

  const deliveryFee = 60;
  const grandTotal = totalPrice + deliveryFee;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }

    if (items.length === 0) {
      toast.error("আপনার কার্ট খালি");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: form.fullName.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim() || null,
          delivery_address: form.address.trim(),
          notes: form.notes.trim() || null,
          delivery_date: form.deliveryDate || null,
          delivery_time: form.deliveryTime || null,
          payment_method: form.paymentMethod,
          subtotal: totalPrice,
          delivery_fee: deliveryFee,
          total: grandTotal,
          user_id: userId,
          order_number: "temp",
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
      toast.success("অর্ডার সফলভাবে প্লেস হয়েছে! 🎉");
      navigate(`/order-success/${order.order_number}`);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-24 pb-32">
        <div className="container mx-auto px-4 text-center py-20">
          <ShoppingBag size={64} className="mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">আপনার কার্ট খালি</h2>
          <p className="text-muted-foreground mb-6">চেকআউট করতে প্রোডাক্ট যোগ করুন</p>
          <Button onClick={() => navigate("/shop")} className="rounded-full">
            শপে যান
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-8">চেকআউট</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Billing & Delivery */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Details */}
              <section className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  বিলিং তথ্য
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName">আপনার পুরো নাম <span className="text-destructive">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="আপনার নাম লিখুন"
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      className="mt-1.5"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label>Country / Region <span className="text-destructive">*</span></Label>
                    <div className="mt-1.5 px-3 py-2.5 bg-muted rounded-md text-sm font-medium">Bangladesh</div>
                  </div>

                  <div>
                    <Label htmlFor="phone">ফোন নম্বর <span className="text-destructive">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="mt-1.5"
                      required
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">ইমেইল (ঐচ্ছিক)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="mt-1.5"
                      maxLength={255}
                    />
                  </div>
                </div>
              </section>

              {/* Delivery Information */}
              <section className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  ডেলিভারি তথ্য
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="address">পূর্ণ ঠিকানা <span className="text-destructive">*</span></Label>
                    <Input
                      id="address"
                      placeholder="বাড়ি নম্বর, রাস্তার নাম, এলাকা"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="mt-1.5"
                      required
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">অর্ডার নোট (ঐচ্ছিক)</Label>
                    <Textarea
                      id="notes"
                      placeholder="ডেলিভারি সম্পর্কে বিশেষ নির্দেশনা..."
                      value={form.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="mt-1.5 min-h-[100px]"
                      maxLength={1000}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">ডেলিভারি তারিখ (ঐচ্ছিক)</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={form.deliveryDate}
                        onChange={(e) => handleChange("deliveryDate", e.target.value)}
                        className="mt-1.5"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label>ডেলিভারি সময় (ঐচ্ছিক)</Label>
                      <Select value={form.deliveryTime} onValueChange={(v) => handleChange("deliveryTime", v)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="সময় নির্বাচন করুন" />
                        </SelectTrigger>
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
                <h2 className="text-lg font-bold mb-6">পেমেন্ট পদ্ধতি</h2>
                <div className="space-y-3">
                  {[
                    { value: "cod", label: "ক্যাশ অন ডেলিভারি", desc: "ডেলিভারির সময় পেমেন্ট করুন" },
                    { value: "bkash", label: "bKash", desc: "বিকাশ মোবাইল পেমেন্ট" },
                    { value: "nagad", label: "Nagad", desc: "নগদ মোবাইল পেমেন্ট" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentMethod === method.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={form.paymentMethod === method.value}
                        onChange={(e) => handleChange("paymentMethod", e.target.value)}
                        className="accent-primary w-4 h-4"
                      />
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
                <h2 className="text-lg font-bold mb-4">অর্ডার সারাংশ</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <img
                        src={(item.product as any).image_url || item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} × ৳{item.product.price}</p>
                      </div>
                      <p className="text-sm font-bold whitespace-nowrap">৳{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">সাবটোটাল</span>
                    <span>৳{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ডেলিভারি ফি</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold">
                  <span>মোট</span>
                  <span className="text-primary">৳{grandTotal.toLocaleString()}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 rounded-full h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> প্রসেসিং...</>
                  ) : (
                    `অর্ডার প্লেস করুন — ৳${grandTotal.toLocaleString()}`
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
