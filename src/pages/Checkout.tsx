import { useState, useMemo, useEffect } from "react";
import paymentMethodsImg from "@/assets/payment-methods.webp";
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
import { Loader2, ShoppingBag, Truck, CreditCard, Minus, Plus, X, Ticket, Check, ChevronsUpDown, Banknote, Wallet, Smartphone, CalendarDays, Clock, MapPin, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { shouldSendMail, shouldSendSms, shouldSendPush, shouldSendAdminMail, sendBrowserPush } from "@/lib/notificationHelper";
import { SameDayAnimation, NextDayAnimation } from "@/components/checkout/DeliveryAnimations";
import SEOHead from "@/components/seo/SEOHead";

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
  const [postalCode, setPostalCode] = useState("");
  const [postalStatus, setPostalStatus] = useState<"idle" | "matched" | "not_found">("idle");
  const [countryOpen, setCountryOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"same_day" | "next_day">("same_day");
  const [form, setForm] = useState({
    fullName: "",
    billingCountry: "Bangladesh",
    phone: "+88",
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
    { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order", statusKeys: ["cod_enabled", "cod_status"], icon: "Banknote" as const },
    { value: "paypal", label: "PayPal", desc: "Pay securely via PayPal", statusKeys: ["paypal_status"], icon: "Wallet" as const },
    { value: "stripe", label: "Stripe", desc: "Pay with credit/debit card via Stripe", statusKeys: ["stripe_status"], icon: "CreditCard" as const },
    { value: "eps", label: "Local & Global Payment", desc: "Pay with Cards, Bkash, Nagad, Upay, etc.", statusKeys: ["eps_status"], icon: "Smartphone" as const },
  ];

  const { data: gatewaySettings = {} } = useQuery({
    queryKey: ["payment-gateway-settings"],
    queryFn: async () => {
      const keys = ["cod_enabled", "cod_status", "paypal_status", "stripe_status", "eps_status", "store_email", "admin_notification_email", "checkout_billing_visible"];
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

  // Auto-detect district from postal code (debounced)
  useEffect(() => {
    const code = postalCode.trim();
    if (!code) {
      setPostalStatus("idle");
      return;
    }
    if (!districts.length) return;
    const t = setTimeout(() => {
      const match = districts.find(
        (d: any) => (d.postal_code || "").toString().trim() === code
      );
      if (match) {
        setSelectedDistrict(match.id);
        setPostalStatus("matched");
      } else {
        setPostalStatus("not_found");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [postalCode, districts]);

  // Keep postal code in sync when district is changed manually
  useEffect(() => {
    if (!selectedDistrict || !districts.length) return;
    const d: any = districts.find((x: any) => x.id === selectedDistrict);
    if (d?.postal_code && d.postal_code !== postalCode) {
      setPostalCode(d.postal_code);
      setPostalStatus("matched");
    }
  }, [selectedDistrict, districts]);

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

  // Fetch product delivery_time for each cart item (to validate same/next day)
  const { data: productDeliveryInfo = [] } = useQuery({
    queryKey: ["checkout-product-delivery", items.map((i) => i.product.id).join(",")],
    queryFn: async () => {
      if (items.length === 0) return [];
      const productIds = items.map((i) => i.product.id);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, delivery_time")
        .in("id", productIds);
      if (error) throw error;
      return data || [];
    },
    enabled: items.length > 0,
  });

  // Classify each product: supports same_day if delivery_time mentions "same"; otherwise next_day only
  const productSupports = useMemo(() => {
    const map = new Map<string, { name: string; sameDay: boolean; nextDay: boolean; label: string }>();
    productDeliveryInfo.forEach((p: any) => {
      const txt = (p.delivery_time || "").toLowerCase().trim();
      // Default: if no delivery_time set, allow both (admin hasn't restricted)
      const hasInfo = txt.length > 0;
      const sameDay = !hasInfo || txt.includes("same");
      const nextDay = !hasInfo || txt.includes("next") || txt.includes("day") || !txt.includes("same");
      map.set(p.id, { name: p.name, sameDay, nextDay, label: p.delivery_time || "" });
    });
    return map;
  }, [productDeliveryInfo]);

  // Find products that don't support the selected delivery type
  const incompatibleItems = useMemo(() => {
    return items
      .map((i) => {
        const info = productSupports.get(i.product.id);
        if (!info) return null;
        const ok = deliveryType === "same_day" ? info.sameDay : info.nextDay;
        if (ok) return null;
        return { id: i.product.id, name: i.product.name, label: info.label };
      })
      .filter(Boolean) as Array<{ id: string; name: string; label: string }>;
  }, [items, productSupports, deliveryType]);

  const hasDeliveryMismatch = incompatibleItems.length > 0;

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

  const activeDistrict: any = districts.find((d: any) => d.id === selectedDistrict);

  // Helper: pick fee field based on delivery type
  const pickFee = (row: any, type: "same_day" | "next_day") => {
    if (!row) return 0;
    if (type === "same_day") return Number(row.same_day_fee ?? row.delivery_fee ?? 0);
    return Number(row.next_day_fee ?? 0);
  };

  // Calculate fee for a given option
  const computeFee = (type: "same_day" | "next_day") => {
    if (!activeDistrict) return 0;
    const defaultFee = pickFee(activeDistrict, type);

    if (!selectedDistrict || productCategories.length === 0) return defaultFee;
    const districtCatFees = categoryFees.filter((cf: any) => cf.district_id === selectedDistrict);
    if (districtCatFees.length === 0) return defaultFee;

    const catIds = productCategories.map((p: any) => p.category_id).filter(Boolean);
    const applicableFees = districtCatFees.filter((cf: any) => catIds.includes(cf.category_id));
    if (applicableFees.length === 0) return defaultFee;

    // Use the highest fee among matching categories
    return applicableFees.reduce((max: number, cf: any) => Math.max(max, pickFee(cf, type)), 0);
  };

  const sameDayFee = useMemo(() => computeFee("same_day"), [activeDistrict, selectedDistrict, categoryFees, productCategories]);
  const nextDayFee = useMemo(() => computeFee("next_day"), [activeDistrict, selectedDistrict, categoryFees, productCategories]);

  // Availability: an option is available when admin explicitly configured it.
  // A fee of 0 means free delivery, not unavailable.
  const sameDayAvailable = useMemo(() => {
    if (!activeDistrict) return false;
    const raw = activeDistrict.same_day_fee;
    return raw !== null && raw !== undefined;
  }, [activeDistrict]);
  const nextDayAvailable = useMemo(() => {
    if (!activeDistrict) return false;
    const raw = activeDistrict.next_day_fee;
    return raw !== null && raw !== undefined;
  }, [activeDistrict]);

  // Auto-select the only available option when district changes
  useEffect(() => {
    if (!activeDistrict) return;
    if (deliveryType === "same_day" && !sameDayAvailable && nextDayAvailable) {
      setDeliveryType("next_day");
    } else if (deliveryType === "next_day" && !nextDayAvailable && sameDayAvailable) {
      setDeliveryType("same_day");
    }
  }, [activeDistrict, sameDayAvailable, nextDayAvailable, deliveryType]);

  const deliveryFee = deliveryType === "same_day" ? sameDayFee : nextDayFee;

  const deliveryLabel =
    deliveryType === "same_day"
      ? (activeDistrict?.same_day_label || "Same Day Delivery")
      : (activeDistrict?.next_day_label || "Next Day Delivery");

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

    const billingVisible = gatewaySettings.checkout_billing_visible !== "false";

    if (billingVisible && (!form.fullName.trim() || !form.phone.trim())) {
      toast.error("Please fill in billing details");
      return;
    }

    if (!form.address.trim() || !form.recipientName.trim() || !form.recipientPhone.trim()) {
      toast.error("Please fill in all required delivery fields");
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

    if (hasDeliveryMismatch) {
      toast.error(`${incompatibleItems.length} item(s) don't support ${deliveryType === "same_day" ? "Same Day" : "Next Day"} delivery. Please switch delivery option or remove them.`);
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
        delivery_type: deliveryType,
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
        const lineUnit = item.product.price + (item.variant?.size?.extraPrice || 0);
        orderItems.push({
          order_id: order.id,
          product_id: item.product.id.startsWith("bouquet-") ? null : item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: lineUnit,
          total: lineUnit * item.quantity,
          custom_images: customImageUrls.length > 0 ? customImageUrls : undefined,
          selected_size: item.variant?.size?.name || null,
          selected_color: item.variant?.color?.name || null,
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

      // Stripe checkout redirect
      if (form.paymentMethod === "stripe") {
        try {
          const { data: stripeData, error: stripeError } = await supabase.functions.invoke("stripe-payment", {
            body: { action: "initialize", order_id: order.id },
          });
          if (stripeError || !stripeData?.redirectUrl) {
            toast.error(stripeData?.error || "Stripe payment initialization failed.");
            setLoading(false);
            return;
          }
          window.location.href = stripeData.redirectUrl;
          return;
        } catch (err: any) {
          console.error("Stripe error:", err);
          toast.error("Failed to connect to Stripe.");
          setLoading(false);
          return;
        }
      }

      // PayPal checkout redirect
      if (form.paymentMethod === "paypal") {
        try {
          const { data: ppData, error: ppError } = await supabase.functions.invoke("paypal-payment", {
            body: { action: "initialize", order_id: order.id },
          });
          if (ppError || !ppData?.redirectUrl) {
            toast.error(ppData?.error || "PayPal payment initialization failed.");
            setLoading(false);
            return;
          }
          window.location.href = ppData.redirectUrl;
          return;
        } catch (err: any) {
          console.error("PayPal error:", err);
          toast.error("Failed to connect to PayPal.");
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
          items: items.map((item) => {
            const u = item.product.price + (item.variant?.size?.extraPrice || 0);
            const variantSuffix = [item.variant?.size?.name, item.variant?.color?.name].filter(Boolean).join(" / ");
            return {
              name: variantSuffix ? `${item.product.name} (${variantSuffix})` : item.product.name,
              quantity: item.quantity,
              total: u * item.quantity,
              imageUrl: (item.product as any).image_url || item.product.image || "",
            };
          }),
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
          items: items.map((item) => {
            const u = item.product.price + (item.variant?.size?.extraPrice || 0);
            const variantSuffix = [item.variant?.size?.name, item.variant?.color?.name].filter(Boolean).join(" / ");
            return {
              name: variantSuffix ? `${item.product.name} (${variantSuffix})` : item.product.name,
              quantity: item.quantity,
              total: u * item.quantity,
              imageUrl: (item.product as any).image_url || item.product.image || "",
            };
          }),
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
      <main className="section-container py-10 pb-24 md:pb-16">
        <SEOHead
          title="Checkout — Pikooly"
          description="Securely complete your order on Pikooly. Fast same-day & next-day delivery, multiple payment methods, and gift personalization."
          noindex
        />
        <div className="max-w-md mx-auto text-center py-12 luxe-panel p-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center bg-[hsl(var(--gold-light))] border border-[hsl(var(--gold)/0.3)]">
            <ShoppingBag size={32} className="text-[hsl(var(--gold-deep))]" />
          </div>
          <span className="eyebrow">Empty Cart</span>
          <h2 className="display-heading text-2xl mt-2 mb-2">Nothing to checkout yet</h2>
          <p className="text-muted-foreground mb-6 text-sm">Add a few thoughtful gifts to begin.</p>
          <Button onClick={() => navigate("/shop")} className="btn-luxe">
            Explore the Collection
          </Button>
        </div>
      </main>
    );
  }

  // Step indicator state derived from form completeness
  const billingStepDone = !!(form.fullName.trim() && form.phone.trim());
  const deliveryStepDone = !!(form.recipientName.trim() && form.recipientPhone.trim() && form.address.trim() && selectedDistrict);
  const paymentStepDone = !!form.paymentMethod;

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      <SEOHead
        title="Secure Checkout — Pikooly"
        description="Securely complete your order on Pikooly. Fast same-day & next-day delivery, multiple payment methods (bKash, Nagad, Cards), and free gift personalization."
        noindex
      />
      <div>
        {/* Header */}
        <div className="text-center mb-5 sm:mb-7 px-2">
          <span className="gold-rule mb-2.5">Secure Checkout</span>
          <h1
            className="display-heading text-foreground break-words"
            style={{ fontSize: "clamp(1.375rem, 4.5vw + 0.25rem, 2.5rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            Complete Your Order
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
            {/* Left - Billing & Delivery */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-8">
              {/* Billing Details */}
              {gatewaySettings.checkout_billing_visible !== "false" && (
              <section className="luxe-panel p-4 sm:p-6">
                <div className="luxe-panel-header mb-4 sm:mb-6">
                  <span className="icon-wrap"><CreditCard size={17} /></span>
                  <span>Billing Details</span>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="phone">WhatsApp Number <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5 flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
                        +88
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your number"
                        value={form.phone.startsWith("+88") ? form.phone.slice(3) : form.phone.startsWith("+") ? form.phone.slice((countryPhoneCodes[form.billingCountry] || "").length) : form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/[^0-9]/g, "");
                          handleChange("phone", "+88" + val);
                        }}
                        className="flex-1 rounded-l-none"
                        required
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1.5" required maxLength={255} />
                  </div>
                </div>
              </section>
              )}

              {/* Delivery Information */}
              <section className="luxe-panel p-4 sm:p-6">
                <div className="luxe-panel-header mb-4 sm:mb-6">
                  <span className="icon-wrap"><Truck size={17} /></span>
                  <span>Delivery Information</span>
                </div>
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
                    <Label htmlFor="postalCode" className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary" />
                      Postal Code
                      <span className="text-[11px] font-normal text-muted-foreground">(auto-fills delivery options)</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="postalCode"
                        inputMode="numeric"
                        placeholder="e.g. 1207"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9-]/g, ""))}
                        className={cn(
                          "pr-28",
                          postalStatus === "matched" && "border-primary/60 focus-visible:ring-primary/40",
                          postalStatus === "not_found" && "border-destructive/60 focus-visible:ring-destructive/30"
                        )}
                        maxLength={10}
                      />
                      {postalStatus === "matched" && activeDistrict && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Check size={12} /> {activeDistrict.name}
                        </span>
                      )}
                      {postalStatus === "not_found" && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={12} /> Not found
                        </span>
                      )}
                    </div>
                    {postalStatus === "not_found" && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Pick your district manually in the order summary.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Full Address <span className="text-destructive">*</span></Label>
                    <Input id="address" placeholder="House no, Street, Area" value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="mt-1.5" required maxLength={500} />
                  </div>
                  <div>
                    <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                    <Textarea id="giftMessage" placeholder="Write a special message for the recipient..." value={form.giftMessage} onChange={(e) => handleChange("giftMessage", e.target.value)} className="mt-1.5 min-h-[80px]" maxLength={500} />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Select Delivery Date & Time Slot</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <label
                        className={cn(
                          "relative flex items-center gap-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition-colors hover:bg-muted/50 cursor-pointer",
                          !form.deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays size={16} className="text-primary shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {form.deliveryDate
                            ? new Date(form.deliveryDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                            : "Select date"}
                        </span>
                        <input
                          type="date"
                          value={form.deliveryDate}
                          onChange={(e) => handleChange("deliveryDate", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          tabIndex={-1}
                        />
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                          <Clock size={16} className="text-primary" />
                        </div>
                        <Select value={form.deliveryTime} onValueChange={(v) => handleChange("deliveryTime", v)}>
                          <SelectTrigger className="h-11 text-sm pl-9"><SelectValue placeholder="Select time" /></SelectTrigger>
                          <SelectContent>
                            {deliveryTimeSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="luxe-panel p-4 sm:p-6">
                <div className="luxe-panel-header mb-3 sm:mb-4">
                  <span className="icon-wrap"><ShieldCheck size={17} /></span>
                  <span>Payment Method</span>
                </div>
                <div className="space-y-2.5">
                  {enabledPaymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment methods available.</p>
                  ) : enabledPaymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`relative flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        form.paymentMethod === method.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <input type="radio" name="paymentMethod" value={method.value} checked={form.paymentMethod === method.value} onChange={(e) => handleChange("paymentMethod", e.target.value)} className="sr-only" />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${form.paymentMethod === method.value ? "bg-primary/15" : "bg-muted"}`}>
                        {method.icon === "Banknote" && <Banknote size={20} className="text-primary" />}
                        {method.icon === "Wallet" && <Wallet size={20} className="text-primary" />}
                        {method.icon === "CreditCard" && <CreditCard size={20} className="text-primary" />}
                        {method.icon === "Smartphone" && <Smartphone size={20} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight">{method.label}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{method.desc}</p>
                      </div>
                      {form.paymentMethod === method.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check size={12} className="text-primary-foreground" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {form.paymentMethod === "eps" && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <img src={paymentMethodsImg} alt="Accepted payment methods - Visa, Mastercard, bKash, Nagad, Rocket, EPS and more" className="w-full h-auto object-contain" loading="lazy" />
                  </div>
                )}
              </section>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-1">
              <div className="luxe-panel p-4 sm:p-6 sticky top-28 overflow-hidden">
                {/* Decorative gold corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--gold)/0.06)] rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="luxe-panel-header mb-4 sm:mb-5">
                    <span className="icon-wrap"><Sparkles size={16} /></span>
                    <span>Order Summary</span>
                  </div>

                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-1 scrollbar-hide">
                    {items.map((item) => {
                      const variantKey = [item.variant?.size?.name || "", item.variant?.color?.name || ""].join("|");
                      const lineUnit = item.product.price + (item.variant?.size?.extraPrice || 0);
                      return (
                      <div key={`${item.product.id}-${variantKey}`} className="flex gap-3 items-start group p-3 rounded-xl border border-border/60 bg-[hsl(var(--ivory))]/40 hover:border-[hsl(var(--gold)/0.35)] transition-colors">
                        <div className="relative shrink-0">
                          <img src={(item.product as any).image_url || item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-muted shadow-sm" />
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[10px] font-bold rounded-full bg-foreground text-background flex items-center justify-center tabular-nums">{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground">{item.product.name}</p>
                          {(item.variant?.size || item.variant?.color) && (
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {item.variant?.size && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide">{item.variant.size.name}</span>
                              )}
                              {item.variant?.color && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">
                                  <span className="w-2 h-2 rounded-full ring-1 ring-border" style={{ backgroundColor: item.variant.color.hex }} />
                                  {item.variant.color.name}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center bg-background border border-border/70 rounded-full">
                              <button type="button" onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), variantKey)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Minus size={11} /></button>
                              <span className="text-[11px] font-bold w-5 text-center tabular-nums">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1, variantKey)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Plus size={11} /></button>
                            </div>
                            <button type="button" onClick={() => removeItem(item.product.id, variantKey)} className="text-muted-foreground hover:text-destructive ml-auto" aria-label="Remove item"><X size={13} /></button>
                          </div>
                          {item.customImages && item.customImages.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {item.customImages.map((file, fi) => (
                                <img key={fi} src={URL.createObjectURL(file)} alt={`Custom ${fi + 1}`} className="w-7 h-7 rounded object-cover border border-border" />
                              ))}
                            </div>
                          )}
                          <p className="text-[13px] font-semibold text-primary mt-1 tabular-nums">{formatPrice(lineUnit * item.quantity)}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  <div className="gold-divider my-5" />

                  {/* Shipping District */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={12} className="text-[hsl(var(--gold-deep))]" />
                      Shipping District <span className="text-destructive">*</span>
                    </Label>
                    <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={districtOpen}
                          className="w-full mt-2 justify-between font-normal h-11 rounded-xl border-border/70 hover:border-[hsl(var(--gold)/0.4)] transition-colors"
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

                    {activeDistrict && (sameDayAvailable || nextDayAvailable) && (
                      <div className="mt-4 space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--gold-deep))]">
                          {sameDayAvailable && nextDayAvailable ? "Choose Delivery Speed" : "Delivery Option"}
                        </p>
                        <div className={cn(
                          "grid gap-2.5",
                          sameDayAvailable && nextDayAvailable ? "grid-cols-1" : "grid-cols-1"
                        )}>
                          {/* Same Day */}
                          {sameDayAvailable && (
                            <button
                              type="button"
                              onClick={() => setDeliveryType("same_day")}
                              className={cn("luxe-option text-left", deliveryType === "same_day" && "is-selected")}
                            >
                              <div className="relative flex items-start gap-3">
                                <div className={cn(
                                  "mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                                  deliveryType === "same_day" ? "border-primary bg-primary/10" : "border-muted-foreground/40"
                                )}>
                                  {deliveryType === "same_day" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                      <SameDayAnimation />
                                      {activeDistrict.same_day_label || "Same Day Delivery"}
                                    </div>
                                    <div className="text-sm font-bold text-primary tabular-nums">{formatPrice(sameDayFee)}</div>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    Bike, CNG & Private Car ·{" "}
                                    <span className="font-semibold text-foreground">Delivery within 2 hours</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )}

                          {/* Next Day */}
                          {nextDayAvailable && (
                            <button
                              type="button"
                              onClick={() => setDeliveryType("next_day")}
                              className={cn("luxe-option text-left", deliveryType === "next_day" && "is-selected")}
                            >
                              <div className="relative flex items-start gap-3">
                                <div className={cn(
                                  "mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                                  deliveryType === "next_day" ? "border-primary bg-primary/10" : "border-muted-foreground/40"
                                )}>
                                  {deliveryType === "next_day" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                      <NextDayAnimation />
                                      {activeDistrict.next_day_label || "Next Day Delivery"}
                                    </div>
                                    <div className="text-sm font-bold text-primary tabular-nums">{formatPrice(nextDayFee)}</div>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    Delivery between{" "}
                                    <span className="font-semibold text-foreground">
                                      {(() => {
                                        const d1 = new Date(); d1.setDate(d1.getDate() + 1);
                                        const d2 = new Date(); d2.setDate(d2.getDate() + 2);
                                        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                        return `${fmt(d1)} – ${fmt(d2)}`;
                                      })()}
                                    </span>
                                    {" "}· Steadfast, Pathao & others couriers
                                  </div>
                                </div>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Delivery mismatch warning */}
                        {hasDeliveryMismatch && (
                          <div className="mt-3 p-3 rounded-xl border border-destructive/40 bg-destructive/5">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-destructive leading-tight">
                                  {incompatibleItems.length === 1 ? "1 item is" : `${incompatibleItems.length} items are`} not available for {deliveryType === "same_day" ? "Same Day" : "Next Day"} delivery
                                </p>
                                <ul className="mt-1.5 space-y-0.5">
                                  {incompatibleItems.slice(0, 3).map((it) => (
                                    <li key={it.id} className="text-[11px] text-foreground/80 flex items-center justify-between gap-2">
                                      <span className="truncate">• {it.name}</span>
                                      {it.label && <span className="text-muted-foreground shrink-0 text-[10px]">{it.label}</span>}
                                    </li>
                                  ))}
                                  {incompatibleItems.length > 3 && (
                                    <li className="text-[11px] text-muted-foreground">+{incompatibleItems.length - 3} more</li>
                                  )}
                                </ul>
                                <p className="text-[11px] text-muted-foreground mt-2">
                                  Switch delivery option above, or remove these items from cart to continue.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Ticket size={12} className="text-[hsl(var(--gold-deep))]" />
                      Coupon Code
                    </Label>
                    {appliedCoupon ? (
                      <div className="luxe-ticket mt-2">
                        <div className="flex items-center gap-2">
                          <Check size={15} className="text-[hsl(var(--gold-deep))]" />
                          <span className="text-sm font-bold text-foreground tracking-wider">{appliedCoupon.code}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `৳${appliedCoupon.discount_value}`})
                          </span>
                        </div>
                        <button type="button" onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="uppercase text-sm tracking-wider rounded-xl border-border/70 focus-visible:ring-[hsl(var(--gold)/0.5)]"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="shrink-0 px-4 rounded-xl border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold-light))] hover:border-[hsl(var(--gold)/0.6)] transition-colors">
                          {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="gold-divider my-5" />

                  {/* Summary */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{formatPrice(totalPrice)}</span>
                    </div>
                    {activeDistrict && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-medium tabular-nums">{formatPrice(deliveryFee)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-[hsl(var(--gold-deep))]">
                        <span className="font-semibold">Discount</span>
                        <span className="font-semibold tabular-nums">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="gold-divider my-4" />

                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold text-primary tabular-nums" style={{ fontFamily: "'Lora', serif" }}>{formatPrice(grandTotal)}</span>
                  </div>

                  <Button type="submit" className="btn-luxe w-full mt-5 h-12 sm:h-13 text-sm sm:text-base" disabled={loading || hasDeliveryMismatch}>
                    {loading ? (
                      <><Loader2 className="animate-spin mr-2" size={18} /> Processing…</>
                    ) : (
                      <>Place Order · <span className="tabular-nums ml-1">{formatPrice(grandTotal)}</span></>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                    <ShieldCheck size={12} className="text-[hsl(var(--gold-deep))]" />
                    Secure SSL checkout · 100% safe payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
