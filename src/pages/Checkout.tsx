import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Truck, CreditCard, Minus, Plus, X, Ticket, Check, ChevronsUpDown } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { shouldSendMail, shouldSendSms, shouldSendPush, shouldSendAdminMail, sendBrowserPush } from "@/lib/notificationHelper";

const countryPhoneCodes: Record<string, string> = {
  "Afghanistan": "+93", "Albania": "+355", "Algeria": "+213", "Andorra": "+376", "Angola": "+244",
  "Argentina": "+54", "Armenia": "+374", "Australia": "+61", "Austria": "+43", "Azerbaijan": "+994",
  "Bahamas": "+1-242", "Bahrain": "+973", "Bangladesh": "+88", "Barbados": "+1-246", "Belarus": "+375",
  "Belgium": "+32", "Belize": "+501", "Benin": "+229", "Bhutan": "+975", "Bolivia": "+591",
  "Bosnia and Herzegovina": "+387", "Botswana": "+267", "Brazil": "+55", "Brunei": "+673", "Bulgaria": "+359",
  "Burkina Faso": "+226", "Burundi": "+257", "Cambodia": "+855", "Cameroon": "+237", "Canada": "+1",
  "Chad": "+235", "Chile": "+56", "China": "+86", "Colombia": "+57", "Comoros": "+269", "Congo": "+243",
  "Costa Rica": "+506", "Croatia": "+385", "Cuba": "+53", "Cyprus": "+357", "Czech Republic": "+420",
  "Denmark": "+45", "Djibouti": "+253", "Dominican Republic": "+1-809", "Ecuador": "+593", "Egypt": "+20",
  "El Salvador": "+503", "Estonia": "+372", "Ethiopia": "+251", "Fiji": "+679", "Finland": "+358",
  "France": "+33", "Gabon": "+241", "Gambia": "+220", "Georgia": "+995", "Germany": "+49", "Ghana": "+233",
  "Greece": "+30", "Guatemala": "+502", "Guinea": "+224", "Guyana": "+592", "Haiti": "+509", "Honduras": "+504",
  "Hungary": "+36", "Iceland": "+354", "India": "+91", "Indonesia": "+62", "Iran": "+98", "Iraq": "+964",
  "Ireland": "+353", "Israel": "+972", "Italy": "+39", "Jamaica": "+1-876", "Japan": "+81", "Jordan": "+962",
  "Kazakhstan": "+7", "Kenya": "+254", "Kuwait": "+965", "Kyrgyzstan": "+996", "Laos": "+856", "Latvia": "+371",
  "Lebanon": "+961", "Liberia": "+231", "Libya": "+218", "Lithuania": "+370", "Luxembourg": "+352",
  "Madagascar": "+261", "Malawi": "+265", "Malaysia": "+60", "Maldives": "+960", "Mali": "+223", "Malta": "+356",
  "Mauritania": "+222", "Mauritius": "+230", "Mexico": "+52", "Moldova": "+373", "Mongolia": "+976",
  "Montenegro": "+382", "Morocco": "+212", "Mozambique": "+258", "Myanmar": "+95", "Namibia": "+264",
  "Nepal": "+977", "Netherlands": "+31", "New Zealand": "+64", "Nicaragua": "+505", "Niger": "+227",
  "Nigeria": "+234", "North Macedonia": "+389", "Norway": "+47", "Oman": "+968", "Pakistan": "+92",
  "Palestine": "+970", "Panama": "+507", "Papua New Guinea": "+675", "Paraguay": "+595", "Peru": "+51",
  "Philippines": "+63", "Poland": "+48", "Portugal": "+351", "Qatar": "+974", "Romania": "+40", "Russia": "+7",
  "Rwanda": "+250", "Saudi Arabia": "+966", "Senegal": "+221", "Serbia": "+381", "Sierra Leone": "+232",
  "Singapore": "+65", "Slovakia": "+421", "Slovenia": "+386", "Somalia": "+252", "South Africa": "+27",
  "South Korea": "+82", "Spain": "+34", "Sri Lanka": "+94", "Sudan": "+249", "Suriname": "+597",
  "Sweden": "+46", "Switzerland": "+41", "Syria": "+963", "Taiwan": "+886", "Tajikistan": "+992",
  "Tanzania": "+255", "Thailand": "+66", "Togo": "+228", "Trinidad and Tobago": "+1-868", "Tunisia": "+216",
  "Turkey": "+90", "Turkmenistan": "+993", "Uganda": "+256", "Ukraine": "+380", "United Arab Emirates": "+971",
  "United Kingdom": "+44", "United States": "+1", "Uruguay": "+598", "Uzbekistan": "+998",
  "Venezuela": "+58", "Vietnam": "+84", "Yemen": "+967", "Zambia": "+260", "Zimbabwe": "+263",
};

const countries = Object.keys(countryPhoneCodes);

const deliveryTimeSlots = [
  "09:00 AM - 01:00 PM",
  "01:00 PM - 05:00 PM",
  "05:00 PM - 09:00 PM",
];

const Checkout = () => {
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const { formatPrice } = useMultiCurrency();
  const { settings: siteSettings } = useSiteSettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
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
    paymentMethod: "eps",
  });

  // Auto-fill form for logged-in users
  const { data: userProfile } = useQuery({
    queryKey: ["checkout-profile", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: defaultAddress } = useQuery({
    queryKey: ["checkout-default-address", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_default", true)
        .maybeSingle();
      if (!data) {
        const { data: latest } = await supabase
          .from("saved_addresses")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return latest;
      }
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    if (userProfile || defaultAddress) {
      setForm((prev) => ({
        ...prev,
        fullName: userProfile?.full_name || user.user_metadata?.full_name || prev.fullName || "",
        phone: userProfile?.phone || defaultAddress?.phone || prev.phone || "",
        email: user.email || prev.email || "",
        billingCountry: prev.billingCountry || "Bangladesh",
        recipientName: defaultAddress?.full_name || userProfile?.full_name || prev.recipientName || "",
        recipientPhone: defaultAddress?.phone || userProfile?.phone || prev.recipientPhone || "",
        address: defaultAddress?.address || prev.address || "",
      }));
    }
  }, [user, userProfile, defaultAddress]);

  const isGatewayEnabled = (value?: string | null) =>
    ["enable", "enabled", "true", "1", "yes", "on"].includes((value ?? "").toLowerCase());

  const allPaymentMethods = [
    { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order", statusKeys: ["cod_enabled", "cod_status"] },
    { value: "paypal", label: "PayPal", desc: "Pay securely via PayPal", statusKeys: ["paypal_status"] },
    { value: "stripe", label: "Stripe", desc: "Pay with credit/debit card via Stripe", statusKeys: ["stripe_status"] },
    { value: "eps", label: "Online Payment", desc: "Pay with Cards, Bkash, Nagad, Upay, etc.", statusKeys: ["eps_status"] },
  ];

  const { data: gatewaySettings = {} } = useQuery({
    queryKey: ["payment-gateway-settings"],
    queryFn: async () => {
      const keys = ["cod_enabled", "cod_status", "paypal_status", "stripe_status", "eps_status", "store_email", "admin_notification_email"];
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value || ""; });
      return map;
    },
    staleTime: 60 * 1000,
  });

  const enabledPaymentMethods = allPaymentMethods.filter((method) =>
    method.statusKeys.some((key) => isGatewayEnabled(gatewaySettings[key]))
  );

  // Auto-select first enabled method if current selection is disabled
  const selectedMethodEnabled = enabledPaymentMethods.some((m) => m.value === form.paymentMethod);
  if (!selectedMethodEnabled && enabledPaymentMethods.length > 0 && form.paymentMethod !== enabledPaymentMethods[0].value) {
    setForm((prev) => ({ ...prev, paymentMethod: enabledPaymentMethods[0].value }));
  }

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

  // Auto-select district for logged-in users with saved address
  useEffect(() => {
    if (!defaultAddress?.district || !districts.length || selectedDistrict) return;
    const match = districts.find((d: any) => 
      d.name.toLowerCase() === defaultAddress.district.toLowerCase()
    );
    if (match) setSelectedDistrict(match.id);
  }, [districts, defaultAddress, selectedDistrict]);

  // Fetch category-specific shipping fees
  const { data: categoryFees = [] } = useQuery({
    queryKey: ["shipping-category-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_category_fees")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all category_ids for cart products (via product_categories many-to-many)
  const { data: productCategories = [] } = useQuery({
    queryKey: ["checkout-product-categories", items.map((i) => i.product.id).join(",")],
    queryFn: async () => {
      if (items.length === 0) return [];
      const productIds = items.map((i) => i.product.id);
      // Get from product_categories junction table
      const { data: pcData, error: pcError } = await supabase
        .from("product_categories")
        .select("product_id, category_id")
        .in("product_id", productIds);
      if (pcError) throw pcError;
      // Also get direct category_id from products table as fallback
      const { data: pData, error: pError } = await supabase
        .from("products")
        .select("id, category_id")
        .in("id", productIds);
      if (pError) throw pError;
      // Combine both sources into unique category_ids
      const catIds = new Set<string>();
      (pcData || []).forEach((pc) => catIds.add(pc.category_id));
      (pData || []).forEach((p) => { if (p.category_id) catIds.add(p.category_id); });
      return Array.from(catIds).map((cid) => ({ category_id: cid }));
    },
    enabled: items.length > 0,
  });

  const activeDistrict = districts.find((d) => d.id === selectedDistrict);

  // Calculate delivery fee & label: use highest category-specific fee, fallback to default
  const { deliveryFee, deliveryLabel } = useMemo(() => {
    if (!activeDistrict) return { deliveryFee: 0, deliveryLabel: "" };
    const defaultFee = activeDistrict.delivery_fee ?? 0;
    const defaultLabel = activeDistrict.delivery_label || "Standard Delivery";

    if (!selectedDistrict || productCategories.length === 0) return { deliveryFee: defaultFee, deliveryLabel: defaultLabel };

    const districtCatFees = categoryFees.filter((cf: any) => cf.district_id === selectedDistrict);
    if (districtCatFees.length === 0) return { deliveryFee: defaultFee, deliveryLabel: defaultLabel };

    const catIds = productCategories.map((p: any) => p.category_id).filter(Boolean);
    const applicableFees = districtCatFees.filter((cf: any) => catIds.includes(cf.category_id));

    if (applicableFees.length === 0) return { deliveryFee: defaultFee, deliveryLabel: defaultLabel };

    // Use the highest fee among matching categories
    const highest = applicableFees.reduce((max: any, cf: any) => cf.delivery_fee > max.delivery_fee ? cf : max, applicableFees[0]);
    return { deliveryFee: highest.delivery_fee, deliveryLabel: highest.delivery_label || defaultLabel };
  }, [activeDistrict, selectedDistrict, categoryFees, productCategories]);

  // Coupon discount calculation
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round((totalPrice * appliedCoupon.discount_value) / 100)
      : Math.min(appliedCoupon.discount_value, totalPrice)
    : 0;

  const grandTotal = totalPrice + deliveryFee - couponDiscount;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Invalid coupon code");
        setCouponLoading(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This coupon has expired");
        setCouponLoading(false);
        return;
      }

      // Check min order
      if (data.min_order_amount && totalPrice < data.min_order_amount) {
        toast.error(`Minimum order ৳${data.min_order_amount} required for this coupon`);
        setCouponLoading(false);
        return;
      }

      // Check max uses
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("This coupon has reached its usage limit");
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(data);
      toast.success(`Coupon "${data.code}" applied!`);
    } catch (err: any) {
      toast.error("Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

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
        discount: couponDiscount,
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

      // Upload custom images to storage and build order items
      const orderItems = [];
      for (const item of items) {
        let customImageUrls: string[] = [];
        if (item.customImages?.length) {
          const { convertToWebP } = await import("@/lib/imageUtils");
          for (const file of item.customImages) {
            const webpFile = await convertToWebP(file);
            const path = `${order.id}/${item.product.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
            const { error: uploadErr } = await supabase.storage
              .from("custom-images")
              .upload(path, webpFile, { contentType: "image/webp" });
            if (!uploadErr) {
              const { data: urlData } = supabase.storage.from("custom-images").getPublicUrl(path);
              customImageUrls.push(urlData.publicUrl);
            }
          }
        }
        orderItems.push({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
          custom_images: customImageUrls.length > 0 ? customImageUrls : undefined,
        });
      }

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Increment coupon used_count
      if (appliedCoupon) {
        await supabase
          .from("coupons")
          .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
          .eq("id", appliedCoupon.id);
      }

      // If EPS payment, redirect to EPS gateway
      if (form.paymentMethod === "eps") {
        try {
          const { data: epsData, error: epsError } = await supabase.functions.invoke("eps-payment", {
            body: { action: "initialize", order_id: order.id },
          });

          if (epsError || !epsData?.redirectUrl) {
            toast.error(epsData?.error || "EPS payment initialization failed. Please try again.");
            setLoading(false);
            return;
          }

          // Redirect to EPS payment page
          window.location.href = epsData.redirectUrl;
          return;
        } catch (epsErr: any) {
          console.error("EPS error:", epsErr);
          toast.error("Failed to connect to EPS payment gateway.");
          setLoading(false);
          return;
        }
      }

      // COD orders go straight to success

      // Fetch alert settings for notification toggles
      const alertSettings = siteSettings;

      // Send order confirmation email (fire & forget) — respects admin toggle
      if (form.email.trim() && shouldSendMail(alertSettings, "pending")) {
        const { buildOrderConfirmationEmail } = await import("@/lib/emailTemplates");
        const emailHtml = buildOrderConfirmationEmail({
          customerName: form.fullName,
          orderNumber: order.order_number,
          deliveryAddress: `${activeDistrict?.name || ""} - ${form.address}`,
          deliveryDate: form.deliveryDate || undefined,
          deliveryTime: form.deliveryTime || undefined,
          recipientName: form.recipientName || undefined,
          paymentMethod: form.paymentMethod === "cod" ? "Cash on Delivery" : form.paymentMethod.toUpperCase(),
          subtotal: totalPrice,
          deliveryFee,
          discount: couponDiscount,
          couponCode: appliedCoupon?.code,
          total: grandTotal,
          note: form.notes || undefined,
          items: items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            total: item.product.price * item.quantity,
            imageUrl: (item.product as any).image_url || item.product.image || "",
          })),
          trackOrderUrl: `${window.location.origin}/track-order`,
          logoUrl: gatewaySettings.company_logo || "",
        });

        supabase.functions.invoke("send-email", {
          body: {
            to: form.email.trim(),
            subject: `Order Confirmed - ${order.order_number} | PikoolyFlora`,
            html: emailHtml,
          },
        }).catch(console.error);
      }

      // Send order SMS to customer (fire & forget) — respects admin toggle
      if (form.phone.trim() && shouldSendSms(alertSettings, "pending")) {
        const trackUrl = `${window.location.origin}/track-order`;
        const smsMessage = `✅ Order Confirmed!\n\nOrder: ${order.order_number}\nTotal: ৳${grandTotal.toFixed(2)}\nDelivery: ${activeDistrict?.name || ""} - ${form.address.trim()}\n\n📦 Track your order:\n${trackUrl}\n\nThank you for shopping with PikoolyFlora! 🌸`;

        supabase.functions.invoke("send-sms", {
          body: {
            to: form.phone.trim(),
            message: smsMessage,
          },
        }).catch(console.error);
      }

      // Send browser push notification — respects admin toggle
      if (shouldSendPush(alertSettings, "pending")) {
        sendBrowserPush(
          "Order Placed! ✅",
          `Order ${order.order_number} has been placed successfully. Total: ৳${grandTotal.toFixed(2)}`
        );
      }

      // Send admin notification email (fire & forget) — respects admin toggle
      const adminEmail = gatewaySettings.admin_notification_email || gatewaySettings.store_email;
      if (adminEmail && shouldSendAdminMail(alertSettings)) {
        const { buildAdminNewOrderEmail } = await import("@/lib/emailTemplates");
        const adminHtml = buildAdminNewOrderEmail({
          customerName: form.fullName,
          orderNumber: order.order_number,
          deliveryAddress: `${activeDistrict?.name || ""} - ${form.address}`,
          deliveryDate: form.deliveryDate || undefined,
          deliveryTime: form.deliveryTime || undefined,
          recipientName: form.recipientName || undefined,
          paymentMethod: form.paymentMethod === "cod" ? "Cash on Delivery" : form.paymentMethod.toUpperCase(),
          subtotal: totalPrice,
          deliveryFee,
          discount: couponDiscount,
          couponCode: appliedCoupon?.code,
          total: grandTotal,
          note: form.notes || undefined,
          items: items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            total: item.product.price * item.quantity,
            imageUrl: (item.product as any).image_url || item.product.image || "",
          })),
          trackOrderUrl: `${window.location.origin}/admin`,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          billingCountry: form.billingCountry || undefined,
          logoUrl: gatewaySettings.company_logo || "",
        });

        supabase.functions.invoke("send-email", {
          body: {
            to: adminEmail,
            subject: `🛒 New Order - ${order.order_number} | PikoolyFlora`,
            html: adminHtml,
          },
        }).catch(console.error);
      }

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
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-5 sm:mb-8 text-center">YOUR ORDER</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
            {/* Left - Billing & Delivery */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-8">
              {/* Billing Details */}
              <section className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Billing Details
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="fullName" placeholder="Enter your name" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className="mt-1.5" required maxLength={100} />
                  </div>
                  <div>
                    <Label>Country / Region <span className="text-destructive">*</span></Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className="w-full mt-1.5 justify-between font-normal h-10"
                        >
                          {form.billingCountry || "Select country"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60] bg-popover" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem
                                  key={c}
                                  value={c}
                                  onSelect={() => {
                                    handleChange("billingCountry", c);
                                    const code = countryPhoneCodes[c] || "";
                                    if (!form.phone || form.phone.startsWith("+")) {
                                      handleChange("phone", code);
                                    }
                                    setCountryOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", form.billingCountry === c ? "opacity-100" : "opacity-0")} />
                                  {c}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp Number <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5 flex">
                      {form.billingCountry && countryPhoneCodes[form.billingCountry] && (
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
                          {countryPhoneCodes[form.billingCountry]}
                        </span>
                      )}
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your number"
                        value={form.phone.startsWith("+") ? form.phone.slice((countryPhoneCodes[form.billingCountry] || "").length) : form.phone}
                        onChange={(e) => {
                          const code = countryPhoneCodes[form.billingCountry] || "";
                          const val = e.target.value.replace(/^0+/, "");
                          handleChange("phone", code ? code + val : e.target.value);
                        }}
                        className={cn("flex-1", form.billingCountry && countryPhoneCodes[form.billingCountry] && "rounded-l-none")}
                        required
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1.5" maxLength={255} />
                  </div>
                </div>
              </section>

              {/* Delivery Information */}
              <section className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
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
                      <div className="relative mt-1.5">
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={form.deliveryDate}
                          onChange={(e) => handleChange("deliveryDate", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className={cn(
                            "w-full",
                            !form.deliveryDate && "text-muted-foreground"
                          )}
                        />
                      </div>
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
              <section className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Payment Method</h2>
                <div className="space-y-2.5 sm:space-y-3">
                  {enabledPaymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment methods available. Please contact support.</p>
                  ) : enabledPaymentMethods.map((method) => (
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
              <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border sticky top-28">
                <h2 className="text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wide">Product</h2>
                
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
                        {item.customImages && item.customImages.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {item.customImages.map((file, fi) => (
                              <img key={fi} src={URL.createObjectURL(file)} alt={`Custom ${fi + 1}`} className="w-8 h-8 rounded object-cover border border-border" />
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>


                <Separator className="my-4" />


                {/* Shipping District */}
                <div>
                  <Label className="text-sm font-semibold">
                    Shipping District <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={districtOpen}
                        className="w-full mt-1.5 justify-between font-normal h-10"
                      >
                        {activeDistrict ? activeDistrict.name : "Select district"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60] bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty>No district found.</CommandEmpty>
                          <CommandGroup>
                            {districts.map((d) => (
                              <CommandItem
                                key={d.id}
                                value={d.name}
                                onSelect={() => {
                                  setSelectedDistrict(d.id);
                                  setDistrictOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedDistrict === d.id ? "opacity-100" : "opacity-0")} />
                                {d.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {activeDistrict && (
                    <div className="mt-2 flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{deliveryLabel}</span>
                      <span className="font-medium">{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Coupon Code */}
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Ticket size={14} className="text-primary" />
                    Coupon Code
                  </Label>
                  {appliedCoupon ? (
                    <div className="mt-1.5 flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2.5 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-primary">{appliedCoupon.code}</span>
                        <span className="text-xs text-muted-foreground">
                          (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `৳${appliedCoupon.discount_value}`})
                        </span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="uppercase text-sm"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="shrink-0 px-4">
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {activeDistrict && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-3" />

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
