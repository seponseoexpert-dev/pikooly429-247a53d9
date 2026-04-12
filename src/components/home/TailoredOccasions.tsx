import { useState, useMemo, useEffect, memo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star, ChevronRight } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const TailoredOccasions = memo(() => {
  const [activeSlug, setActiveSlug] = useState("");
  const { formatPrice } = useMultiCurrency();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: occasionCategories = [] } = useQuery({
    queryKey: ["homepage-occasion-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .eq("show_in_homepage", true)
        .eq("category_type", "tailored")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!occasionCategories.length) { setActiveSlug(""); return; }
    setActiveSlug((prev) =>
      prev && occasionCategories.some((c) => c.slug === prev) ? prev : occasionCategories[0].slug
    );
  }, [occasionCategories]);

  const filteredProducts = useMemo(() => {
    if (!activeSlug) return products;
    return products.filter((p: any) => {
      if (p.categories?.slug === activeSlug) return true;
      if (p.product_categories?.some((pc: any) => pc.categories?.slug === activeSlug)) return true;
      return false;
    });
  }, [activeSlug, products]);

  const activeCat = occasionCategories.find((c) => c.slug === activeSlug);
  const viewAllLink = activeCat ? `/shop?cat=${activeCat.slug}` : "/shop";
  const viewAllText = activeCat ? `View All ${activeCat.name} Gifts` : "View All Gifts";

  if (occasionCategories.length === 0 && !isLoading) return null;

  return (
    <section className="bg-[#f5f5f0] py-6 sm:py-8 md:py-10" aria-label="Tailored For Your Occasions">
      <div className="section-container">
        {/* Title — Serif font */}
        <h2 className="font-serif text-xl sm:text-2xl md:text-[28px] font-bold text-foreground mb-4 sm:mb-5 tracking-tight">
          Tailored For Your Occasions
        </h2>

        {/* FNP Tabs */}
        {occasionCategories.length > 0 && (
          <div className="relative mb-4 md:mb-5">
            <div className="flex overflow-x-auto scrollbar-hide border-b border-border/30">
              {occasionCategories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveSlug(cat.slug)}
                    className={`flex flex-col items-center gap-1.5 px-5 sm:px-7 md:px-8 pt-3 pb-2.5 shrink-0 transition-all duration-200 relative
                      ${isActive
                        ? "bg-[#f5f3eb] text-foreground rounded-t-xl border border-border/30 border-b-transparent -mb-px z-10"
                        : "text-muted-foreground hover:text-foreground/80 border border-transparent"
                      }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Gift size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <span className={`text-xs sm:text-[13px] whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products — horizontal scroll on mobile showing 2.5 cards, grid on desktop */}
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[42vw] sm:min-w-0 bg-background rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Gift className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No products found for this occasion</p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll showing ~2.5 cards */}
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 sm:hidden"
              style={{ scrollPaddingLeft: '0px' }}
            >
              {filteredProducts.slice(0, 10).map((product: any) => (
                <div key={product.id} className="min-w-[40vw] max-w-[42vw] snap-start shrink-0">
                  <TailoredProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
            {/* Tablet+ grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.slice(0, 8).map((product: any) => (
                <TailoredProductCard key={product.id} product={product} formatPrice={formatPrice} />
              ))}
            </div>
          </>
        )}

        {/* CTA — ghost button, full-width mobile */}
        {filteredProducts.length > 0 && (
          <div className="mt-5 sm:mt-7">
            <Link
              to={viewAllLink}
              className="flex items-center justify-center w-full sm:w-auto sm:inline-flex gap-1 px-8 py-3 border border-[#8a9a5b] text-[#5a6b2e] rounded-lg text-sm font-semibold hover:bg-[#6b7c3e] hover:text-white hover:border-[#6b7c3e] transition-all duration-300"
            >
              {viewAllText}
              <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
});

/* Clean minimal product card */
const TailoredProductCard = memo(({ product, formatPrice }: { product: any; formatPrice: (n: number) => string }) => {
  const imgSrc = product.image_url || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;
  const origPrice = product.original_price;
  const hasDiscount = origPrice && origPrice > product.price;
  const rating = product.rating;
  const isBestSeller = product.is_featured;

  return (
    <Link
      to={linkTo}
      className="group bg-background rounded-lg overflow-hidden flex flex-col shadow-[0_1px_6px_-1px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/5">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />
        {product.delivery_time && (
          <span className="absolute bottom-1.5 left-1.5 bg-background/90 backdrop-blur-sm text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 text-foreground/70">
            🕐 {product.delivery_time}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
        {/* Product name — sans-serif */}
        <h3 className="font-sans text-[12px] sm:text-[13px] font-medium text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-auto pt-0.5">
          {hasDiscount && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="text-[14px] sm:text-[15px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Tags */}
        {hasDiscount ? (
          <span className="inline-block self-start text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 tracking-wide">
            PRICE DROP
          </span>
        ) : isBestSeller ? (
          <span className="inline-block self-start text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 tracking-wide">
            BEST SELLER
          </span>
        ) : null}

        {/* Rating */}
        {rating && rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} className="fill-emerald-600 text-emerald-600" />
            <span className="text-[11px] font-semibold text-foreground/70">
              {rating.toFixed(1)}
            </span>
            {product.review_count > 0 && (
              <span className="text-[10px] text-muted-foreground">
                | {product.review_count}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});

TailoredOccasions.displayName = "TailoredOccasions";
TailoredProductCard.displayName = "TailoredProductCard";

export default TailoredOccasions;
