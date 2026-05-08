import { Plus, Minus, ShoppingBag, Trash2, ImagePlus, ChevronUp, ChevronDown } from "lucide-react";
import { useCart, buildVariantKey } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { parseDeliveryBadge } from "@/lib/deliveryBadge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import SEOHead from "@/components/seo/SEOHead";

const CartPage = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, addItem, setIsOpen } = useCart();
  const { formatPrice } = useMultiCurrency();
  const navigate = useNavigate();
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Make sure the drawer is never open while on the dedicated cart page
  useEffect(() => { setIsOpen(false); }, [setIsOpen]);

  const { data: addonProducts = [] } = useQuery({
    queryKey: ["cart-page-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_addons")
        .select("product_id, sort_order, products!inner(id, name, slug, price, original_price, image_url, is_active, stock_quantity)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((r) => r.products).filter((p: any) => p && p.is_active);
    },
    staleTime: 5 * 60 * 1000,
  });

  const inCartIds = new Set(items.map((i) => i.product.id));
  const addons = addonProducts.filter((p: any) => !inCartIds.has(p.id)).slice(0, 8);

  return (
    <>
      <SEOHead title="Your Cart" description="Review the items in your cart and proceed to checkout." />
      <main className="min-h-screen bg-background pb-32">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--gold-light))] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-deep))]">
              <ShoppingBag size={17} />
            </span>
            <div>
              <p className="eyebrow text-[10px]">Your Selection</p>
              <h1 className="font-display text-lg sm:text-xl font-semibold text-foreground leading-none mt-0.5">
                Cart <span className="text-muted-foreground font-normal">· {totalItems}</span>
              </h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border/40">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag size={36} className="opacity-40" />
              </div>
              <p className="font-semibold text-base text-foreground">Your cart is empty</p>
              <p className="text-sm mt-1.5">Start adding some beautiful gifts!</p>
              <Button variant="outline" className="mt-5 rounded-full" onClick={() => navigate("/")}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const variantKey = buildVariantKey(item.variant);
                const lineUnit = item.product.price + (item.variant?.size?.extraPrice || 0);
                let badge = parseDeliveryBadge(item.product.deliveryTime);
                if (!badge) {
                  const sd = item.product.sameDayDistricts;
                  const nd = item.product.nextDayDistricts;
                  if (Array.isArray(sd) && sd.length > 0) badge = parseDeliveryBadge("same day");
                  else if (Array.isArray(nd) && nd.length > 0) badge = parseDeliveryBadge("next day");
                  else badge = parseDeliveryBadge("standard");
                }
                return (
                  <div
                    key={`${item.product.id}-${variantKey}`}
                    className="bg-card rounded-2xl border border-border/40 hover:border-border/70 transition-colors overflow-hidden"
                  >
                    {badge && (
                      <div className="flex items-center gap-2 px-3.5 py-2 bg-primary/[0.06] border-b border-border/40 text-[12px]">
                        <span className="font-semibold text-foreground">Express Delivery</span>
                        <span className={cn("inline-flex items-center gap-1 font-semibold text-primary")}>
                          <badge.Icon size={13} className="shrink-0" />
                          {badge.label}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3.5 p-3">
                      <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl shadow-sm"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <Link to={`/product/${item.product.id}`}>
                            <h4 className="font-semibold text-sm sm:text-[15px] text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
                              {item.product.name}
                            </h4>
                          </Link>
                          {(item.variant?.size || item.variant?.color) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {item.variant.size && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                                  {item.variant.size.name}
                                </span>
                              )}
                              {item.variant.color && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-semibold">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full ring-1 ring-border"
                                    style={{ backgroundColor: item.variant.color.hex }}
                                  />
                                  {item.variant.color.name}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-primary font-bold text-sm sm:text-base mt-1">{formatPrice(lineUnit)}</p>
                          {item.customImages && item.customImages.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <ImagePlus size={12} className="text-primary" /> {item.customImages.length} custom photo(s)
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-primary/95 text-primary-foreground rounded-full px-1 py-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, variantKey)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold w-7 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, variantKey)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, variantKey)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Last minute add-ons */}
              {addons.length > 0 && (
                <section className="mt-5 rounded-2xl bg-[hsl(var(--gold-light)/0.5)] border border-[hsl(var(--gold)/0.25)] p-3 sm:p-4">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3">
                    Your last minute add-ons
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {addons.map((p: any) => (
                      <div key={p.id} className="bg-card rounded-xl border border-border/40 overflow-hidden flex flex-col">
                        <Link to={`/product/${p.id}`} className="block aspect-square bg-muted">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        </Link>
                        <div className="p-2.5 flex flex-col flex-1">
                          <Link to={`/product/${p.id}`} className="font-semibold text-[13px] text-foreground line-clamp-2 leading-snug hover:text-primary">
                            {p.name}
                          </Link>
                          <p className="text-primary font-bold text-sm mt-1">{formatPrice(p.price)}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full mt-2 h-8 text-xs"
                            onClick={() =>
                              addItem(
                                {
                                  id: p.id,
                                  name: p.name,
                                  price: p.price,
                                  originalPrice: p.original_price ?? undefined,
                                  image: p.image_url,
                                  category: "",
                                  inStock: (p.stock_quantity ?? 1) > 0,
                                },
                                undefined,
                                true
                              )
                            }
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        {items.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
            <div className="container mx-auto max-w-3xl px-3 sm:px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setSummaryOpen((v) => !v)}
                className="flex-1 flex items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-left"
                aria-expanded={summaryOpen}
              >
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Total</p>
                  <p className="text-primary font-bold text-base sm:text-lg leading-none mt-0.5">{formatPrice(totalPrice)}</p>
                </div>
                {summaryOpen ? <ChevronDown size={18} className="text-primary" /> : <ChevronUp size={18} className="text-primary" />}
              </button>
              <Link to="/checkout" className="flex-[1.4]">
                <Button className="btn-luxe w-full h-12 text-sm sm:text-base rounded-xl">PLACE ORDER</Button>
              </Link>
            </div>
            {summaryOpen && (
              <div className="container mx-auto max-w-3xl px-3 sm:px-4 pb-3 -mt-1 text-xs text-muted-foreground">
                <div className="flex items-baseline justify-between border-t border-border/60 pt-2">
                  <span>{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                  <span>Taxes & delivery at checkout</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default CartPage;
