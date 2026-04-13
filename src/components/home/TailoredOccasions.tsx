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
    <section className="bg-white py-5 sm:py-8 md:py-10" aria-label="Tailored For Your Occasions">
      <div className="section-container">
        {/* Title */}
        <h2 className="font-serif text-[22px] sm:text-2xl md:text-[28px] font-bold text-foreground mb-4 sm:mb-5 tracking-tight leading-tight">
          Tailored For Your Occasions
        </h2>

        {/* FNP-Style Tabs */}
        {occasionCategories.length > 0 && (
          <div className="relative mb-5">
            {/* Bottom border line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#d5d5c8]" />
            <div className="flex overflow-x-auto scrollbar-hide">
              {occasionCategories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveSlug(cat.slug)}
                    className={`flex flex-col items-center gap-1.5 px-4 sm:px-6 md:px-8 pt-3 pb-2.5 shrink-0 transition-all duration-200 relative
                      ${isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/70"
                      }`}
                  >
                    {/* Active tab background */}
                    {isActive && (
                      <div className="absolute inset-0 bottom-0 rounded-t-lg border border-[#8a9a5b]/50 border-b-white bg-[#faf9f4] -mb-[1px] z-0" />
                    )}
                    <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
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
                    <span className={`relative z-10 text-[11px] sm:text-[13px] whitespace-nowrap leading-tight ${isActive ? "font-bold text-[#3d4a24]" : "font-medium"}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-md overflow-hidden">
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
              className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 sm:hidden"
            >
              {filteredProducts.slice(0, 10).map((product: any) => (
                <div key={product.id} className="min-w-[42vw] max-w-[44vw] snap-start shrink-0">
                  <ProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
            {/* Tablet+ grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        {filteredProducts.length > 0 && (
          <div className="mt-5 sm:mt-7">
            <Link
              to={viewAllLink}
              className="flex items-center justify-center w-full sm:w-auto sm:inline-flex gap-1.5 px-8 py-3.5 border border-[#8a9a5b] text-[#5a6b2e] rounded-lg text-sm font-semibold hover:bg-[#6b7c3e] hover:text-white hover:border-[#6b7c3e] transition-all duration-300"
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

/* Clean FNP-style product card with square image */
const ProductCard = memo(({ product, formatPrice }: { product: any; formatPrice: (n: number) => string }) => {
  const imgSrc = product.image_url || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;
  const origPrice = product.original_price;
  const hasDiscount = origPrice && origPrice > product.price;
  const rating = product.rating;
  const isBestSeller = product.is_featured;

  return (
    <Link
      to={linkTo}
      className="group bg-white rounded-md overflow-hidden flex flex-col"
    >
      {/* Square image */}
      <div className="relative aspect-square overflow-hidden bg-[#f8f8f6]">
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
          <span className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 text-foreground/70">
            🕐 {product.delivery_time}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-1.5 sm:px-2.5 pt-2.5 pb-3 flex flex-col gap-0.5 flex-1">
        {/* Product name */}
        <h3 className="font-sans text-[12px] sm:text-[13px] font-normal text-foreground/90 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-1">
          {hasDiscount && (
            <span className="text-[11px] sm:text-[12px] text-muted-foreground line-through">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="text-[15px] sm:text-[16px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Rating */}
        {rating && rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-[1px] rounded-sm">
              <span className="text-[10px] font-bold">{rating.toFixed(1)}</span>
              <Star size={8} className="fill-white text-white" />
            </div>
            {product.review_count > 0 && (
              <span className="text-[11px] text-muted-foreground">
                | {product.review_count}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {hasDiscount ? (
          <span className="inline-block self-start text-[9px] sm:text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
            Price Drop
          </span>
        ) : isBestSeller ? (
          <span className="inline-block self-start text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
            Best Seller
          </span>
        ) : null}
      </div>
    </Link>
  );
});

TailoredOccasions.displayName = "TailoredOccasions";
ProductCard.displayName = "ProductCard";

export default TailoredOccasions;
