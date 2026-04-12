import { useState, useMemo, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";

const TailoredOccasions = memo(() => {
  const [activeSlug, setActiveSlug] = useState("");
  const { formatPrice } = useMultiCurrency();

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
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-5">
          Tailored For Your Occasions
        </h2>

        {/* FNP-style Tabs */}
        {occasionCategories.length > 0 && (
          <div className="relative mb-5 md:mb-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-0 border-b border-border/40">
              {occasionCategories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveSlug(cat.slug)}
                    className={`flex flex-col items-center gap-1.5 px-4 sm:px-6 md:px-8 py-3 sm:py-4 shrink-0 transition-all duration-200 relative ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/80"
                    }`}
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Gift size={22} strokeWidth={1.5} />
                      )}
                    </div>
                    <span className={`text-xs sm:text-[13px] whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>
                      {cat.name}
                    </span>
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#6b7c3e] rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Grid — 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-background rounded-xl overflow-hidden">
                <div className="aspect-[4/5] bg-muted animate-pulse" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.slice(0, 8).map((product: any) => (
              <TailoredProductCard key={product.id} product={product} formatPrice={formatPrice} />
            ))}
          </div>
        )}

        {/* CTA Button */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-6 sm:mt-8">
            <Link
              to={viewAllLink}
              className="inline-block w-full sm:w-auto px-10 py-3 border border-[#6b7c3e] text-[#6b7c3e] rounded-lg text-sm font-semibold hover:bg-[#6b7c3e] hover:text-white transition-all duration-300"
            >
              {viewAllText} ›
            </Link>
          </div>
        )}
      </div>
    </section>
  );
});

/* FNP-style product card — clean white, image, title, price, rating */
const TailoredProductCard = memo(({ product, formatPrice }: { product: any; formatPrice: (n: number) => string }) => {
  const imgSrc = product.image_url || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;
  const origPrice = product.original_price;
  const hasDiscount = origPrice && origPrice > product.price;
  const rating = product.rating;

  return (
    <Link to={linkTo} className="group bg-background rounded-xl overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/10">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={300}
          height={375}
        />
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-foreground/80">
            <span className="w-3 h-3 text-muted-foreground">⏰</span>
            {product.delivery_time}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-auto">
          {hasDiscount && (
            <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="text-sm sm:text-base font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>

        {hasDiscount && (
          <span className="inline-block self-start text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            PRICE DROP
          </span>
        )}

        {rating && rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-[11px] sm:text-xs font-medium text-foreground/70">
              {rating.toFixed(1)}
              {product.review_count ? ` | ${product.review_count}` : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
});

TailoredOccasions.displayName = "TailoredOccasions";
TailoredProductCard.displayName = "TailoredProductCard";

export default TailoredOccasions;
