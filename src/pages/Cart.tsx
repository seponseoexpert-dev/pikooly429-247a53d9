import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart, buildVariantKey } from "@/contexts/CartContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { parseDeliveryBadge } from "@/lib/deliveryBadge";
import { useCheckoutDelivery } from "@/hooks/useCheckoutDelivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, ShoppingBag, Receipt, Ticket, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SEOHead from "@/components/seo/SEOHead";

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, addItem, totalPrice, totalItems, setIsOpen } = useCart();
  const { formatPrice } = useMultiCurrency();
  const { settings } = useSiteSettings();

  // Close drawer if open (we now have a dedicated page)
  useEffect(() => { setIsOpen(false); }, [setIsOpen]);

  const accent = settings.cart_accent_color || "#0a4d5c";
  const addonsBg = settings.cart_addons_bg_color || "#fde9d9";
  const savingsBg = settings.cart_savings_bg_color || "#d4edf7";
  const expressEnabled = (settings.cart_express_section_enabled ?? "true") !== "false";
  const addonsEnabled = (settings.cart_addons_enabled ?? "true") !== "false";
  const savingsEnabled = (settings.cart_savings_enabled ?? "true") !== "false";
  const billEnabled = (settings.cart_bill_summary_enabled ?? "true") !== "false";
  const expressHeading = settings.cart_express_heading || "Express Delivery";
  const addonsHeading = settings.cart_addons_heading || "Your last minute add-ons";
  const savingsTpl = settings.cart_savings_heading || "You have saved {amount} on this order";
  const billHeading = settings.cart_bill_summary_heading || "Bill Summary";

  // Resolve each item's delivery mode via category mapping
  const { groups: deliveryGroups } = useCheckoutDelivery(items);
  const productModeMap = useMemo(() => {
    const m = new Map<string, { name: string; delivery_time: string; badge_text: string | null }>();
    deliveryGroups.forEach((g) => {
      g.productIds.forEach((pid) => m.set(pid, { name: g.mode.name, delivery_time: g.mode.delivery_time, badge_text: g.mode.badge_text }));
    });
    return m;
  }, [deliveryGroups]);

  // ------- Coupon (mirrors Checkout logic, simplified) -------
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = totalPrice;
  const originalTotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const orig = i.product.originalPrice ?? i.product.price;
        const base = orig + (i.variant?.size?.extraPrice || 0);
        return sum + base * i.quantity;
      }, 0),
    [items]
  );
  const autoSavings = Math.max(0, originalTotal - subtotal);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return Math.round((subtotal * Number(appliedCoupon.discount_value || 0)) / 100);
    }
    return Math.min(subtotal, Number(appliedCoupon.discount_value || 0));
  }, [appliedCoupon, subtotal]);

  const totalSavings = autoSavings + couponDiscount;
  const orderTotal = Math.max(0, subtotal - couponDiscount);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        toast.error("Invalid coupon code");
        return;
      }
      const min = Number(data.min_order_amount || 0);
      if (subtotal < min) {
        toast.error(`Minimum order ${formatPrice(min)} required`);
        return;
      }
      setAppliedCoupon(data);
      toast.success(`Coupon "${data.code}" applied`);
    } finally {
      setCouponLoading(false);
    }
  };

  // ------- Add-ons -------
  const { data: addons = [] } = useQuery({
    queryKey: ["cart-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_addons")
        .select("product_id, sort_order, products!inner(id, name, slug, price, original_price, image_url, is_active)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[])
        .map((r) => r.products)
        .filter((p) => p && p.is_active);
    },
    staleTime: 5 * 60 * 1000,
  });

  const cartProductIds = new Set(items.map((i) => i.product.id));
  const addonList = addons.filter((p: any) => !cartProductIds.has(p.id));

  // ------- Mobile sticky bottom bar collapse -------
  const [billOpen, setBillOpen] = useState(false);

  if (items.length === 0) {
    return (
      <>
        <SEOHead title="Your Cart" description="Review the items in your shopping cart." />
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-5">
            <ShoppingBag size={42} className="opacity-40" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Button onClick={() => navigate("/shop")} className="rounded-full px-6">
            Continue Shopping
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Your Cart" description="Review your selected items, add-ons and proceed to checkout." />
      <div className="min-h-screen bg-[#f7f8fa] pb-40 lg:pb-12">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 lg:py-8 space-y-4">
          {/* === Express Delivery Cards (one card per item) === */}
          {expressEnabled && items.map((item) => {
            const variantKey = buildVariantKey(item.variant);
            const lineUnit = item.product.price + (item.variant?.size?.extraPrice || 0);
            const resolved = productModeMap.get(item.product.id);
            const badge = resolved
              ? parseDeliveryBadge(resolved.delivery_time)
              : parseDeliveryBadge(item.product.deliveryTime) || parseDeliveryBadge("standard");
            const modeLabel = resolved?.name || expressHeading;
            const modeBadgeText = resolved?.badge_text;
            const orig = item.product.originalPrice;
            return (
              <div key={`${item.product.id}-${variantKey}`} className="bg-white rounded-2xl border border-[#e6e8ec] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                {badge && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#eaf3f8] border-b border-[#dfe8ef] text-[13px]">
                    <span className="font-bold" style={{ color: accent }}>{modeLabel}</span>
                    <span className="inline-flex items-center gap-1 font-semibold" style={{ color: accent }}>
                      <badge.Icon size={14} className="shrink-0" />
                      {badge.label}
                    </span>
                    {modeBadgeText && (
                      <span className="text-[11px] font-medium opacity-80" style={{ color: accent }}>
                        · {modeBadgeText}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-3 p-3">
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <Link to={`/product/${item.product.id}`}>
                        <h3 className="font-semibold text-[15px] sm:text-base text-foreground line-clamp-2 leading-snug hover:underline">
                          {item.product.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="font-bold text-[15px] sm:text-base" style={{ color: accent }}>
                          {formatPrice(lineUnit)}
                        </span>
                        {orig && orig > item.product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(orig + (item.variant?.size?.extraPrice || 0))}
                          </span>
                        )}
                      </div>
                      {(item.variant?.size || item.variant?.color) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.variant.size && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold uppercase">{item.variant.size.name}</span>
                          )}
                          {item.variant.color && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold inline-flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: item.variant.color.hex }} />
                              {item.variant.color.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div
                        className="inline-flex items-center rounded-full text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, variantKey)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10"
                          aria-label="Decrease"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-bold min-w-[28px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, variantKey)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10"
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, variantKey)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* === Last minute add-ons === */}
          {addonsEnabled && addonList.length > 0 && (
            <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: addonsBg }}>
              <h2 className="font-bold text-base sm:text-lg mb-3" style={{ color: accent }}>
                {addonsHeading}
              </h2>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
                {addonList.map((p: any) => (
                  <div
                    key={p.id}
                    className="snap-start shrink-0 w-[160px] sm:w-[180px] bg-white rounded-xl overflow-hidden flex flex-col"
                  >
                    <Link to={`/product/${p.slug || p.id}`} className="block aspect-square bg-muted">
                      <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </Link>
                    <div className="p-2.5 flex flex-col flex-1">
                      <p className="text-[13px] font-medium line-clamp-2 leading-snug min-h-[34px]">{p.name}</p>
                      <p className="font-bold text-sm mt-1.5" style={{ color: accent }}>{formatPrice(Number(p.price))}</p>
                      <button
                        onClick={() => {
                          addItem(
                            {
                              id: p.id,
                              name: p.name,
                              price: Number(p.price),
                              originalPrice: p.original_price ? Number(p.original_price) : undefined,
                              image: p.image_url || "/placeholder.svg",
                              category: "",
                              inStock: true,
                            },
                            undefined,
                            true
                          );
                          toast.success("Added to cart");
                        }}
                        className="mt-2 w-full border rounded-md py-1.5 text-[13px] font-semibold hover:bg-muted transition-colors"
                        style={{ color: accent, borderColor: accent }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Savings pill === */}
          {savingsEnabled && totalSavings > 0 && (
            <div className="flex justify-center">
              <div
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: savingsBg, color: accent }}
              >
                {savingsTpl.replace("{amount}", formatPrice(totalSavings))}
              </div>
            </div>
          )}

          {/* === Bill summary === */}
          {billEnabled && (
            <div className="bg-white rounded-2xl border border-[#dfe8ef] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#dfe8ef]">
                <h3 className="font-bold text-base sm:text-lg" style={{ color: accent }}>{billHeading}</h3>
                <span className="text-sm font-semibold" style={{ color: accent }}>
                  {totalItems} {totalItems === 1 ? "Item" : "Items"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <Receipt size={18} style={{ color: accent }} />
                  Order Total
                </span>
                <span className="text-foreground font-semibold">
                  {originalTotal > subtotal && (
                    <span className="text-muted-foreground line-through mr-2 font-normal">{formatPrice(originalTotal)}</span>
                  )}
                  {formatPrice(subtotal)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between pb-3 text-sm">
                  <span className="text-muted-foreground">Coupon ({appliedCoupon?.code})</span>
                  <span className="text-green-600 font-semibold">- {formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#dfe8ef]">
                <span className="font-bold text-base" style={{ color: accent }}>Grand Total</span>
                <span className="font-bold text-base" style={{ color: accent }}>{formatPrice(orderTotal)}</span>
              </div>
            </div>
          )}

          {/* Coupon note (FlowerAura style — text only) */}
          <div className="text-center px-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Have a Coupon Code?</span>{" "}
              You can apply the discount coupon in the Checkout Process.
            </p>
          </div>

        </div>

        {/* === Sticky bottom bar === */}
        <div className="fixed left-0 right-0 bottom-0 lg:static lg:max-w-5xl lg:mx-auto lg:px-5 lg:pb-8 z-40">
          <div className="bg-white border-t border-[#dfe8ef] shadow-[0_-2px_12px_rgba(0,0,0,0.05)] lg:rounded-2xl lg:border lg:shadow-none">
            {billOpen && (
              <div className="p-4 border-b border-dashed lg:hidden">
                <div className="flex justify-between text-sm py-1">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm py-1 text-green-600">
                    <span>Coupon</span><span>- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1 font-bold">
                  <span>Total</span><span>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <button
                onClick={() => setBillOpen((v) => !v)}
                className="flex-1 lg:flex-none lg:min-w-[180px] rounded-xl px-3 py-2 text-left flex items-center justify-between"
                style={{ backgroundColor: savingsBg }}
              >
                <div>
                  <div className="text-[11px] font-medium" style={{ color: accent }}>Total</div>
                  <div className="font-bold text-base" style={{ color: accent }}>
                    {formatPrice(orderTotal)}
                    {originalTotal > subtotal && (
                      <span className="text-xs text-muted-foreground line-through ml-2 font-normal">{formatPrice(originalTotal)}</span>
                    )}
                  </div>
                </div>
                <span className="lg:hidden" style={{ color: accent }}>
                  {billOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </span>
              </button>
              <Button
                onClick={() => navigate("/checkout")}
                className="flex-1 h-12 rounded-xl text-white font-bold tracking-wide"
                style={{ backgroundColor: accent }}
              >
                PLACE ORDER
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
