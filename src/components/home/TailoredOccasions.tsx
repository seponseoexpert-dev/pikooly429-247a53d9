import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star, ChevronRight } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const TailoredOccasions = memo(() => {
  const [activeSlug, setActiveSlug] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const { formatPrice } = useMultiCurrency();

  const handleTabChange = useCallback((slug: string) => {
    if (slug !== activeSlug) {
      setActiveSlug(slug);
      setAnimKey((k) => k + 1);
    }
  }, [activeSlug]);
  

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
    <section className="bg-gradient-to-b from-[#faf9f6] to-white py-6 sm:py-10 md:py-12" aria-label="Tailored For Your Occasions">
      <div className="section-container">
        {/* Title */}
        <h2 className="font-serif text-[22px] sm:text-2xl md:text-[28px] font-bold text-foreground mb-1 tracking-tight leading-tight">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-[13px] sm:text-sm mb-5 sm:mb-6">
          Find the perfect gift for every special moment
        </p>

        {/* Premium Tabs */}
        {occasionCategories.length > 0 && (
          <div className="relative mb-6">
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d5d5c8] to-transparent" />
            <div className="flex overflow-x-auto scrollbar-hide gap-0.5">
              {occasionCategories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleTabChange(cat.slug)}
                    className={`flex flex-col items-center gap-1.5 px-5 sm:px-7 md:px-8 pt-3.5 pb-3 shrink-0 transition-all duration-300 relative rounded-t-xl
                      ${isActive
                        ? "bg-gradient-to-b from-[#f0ede4] to-[#e8e4d8] shadow-[0_-2px_10px_rgba(107,124,62,0.1)]"
                        : "hover:bg-[#f5f3ee]/60"
                      }`}
                  >
                    {/* Active indicator bar with glow */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1.5 right-1.5 h-[3px] bg-gradient-to-r from-[#8a9a5b] via-[#a3b56e] to-[#6b7c3e] rounded-full z-10 shadow-[0_0_6px_rgba(138,154,91,0.4)]" />
                    )}
                    {/* Icon with colorful circle background */}
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-br from-[#e8f0d8] to-[#d4e0bc] shadow-[0_2px_8px_rgba(138,154,91,0.25)] scale-110" 
                        : "bg-[#f5f3ee] group-hover:bg-[#eee]"
                    }`}>
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className={`w-7 h-7 sm:w-8 sm:h-8 object-contain transition-all duration-300 drop-shadow-sm ${isActive ? "drop-shadow-md" : ""}`}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Gift size={22} strokeWidth={1.5} className={`transition-colors duration-300 ${isActive ? "text-[#5a6b2e]" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <span className={`text-[11px] sm:text-[12.5px] whitespace-nowrap leading-tight transition-all duration-200 ${isActive ? "font-bold text-[#3d4a24]" : "font-medium text-muted-foreground"}`}>
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
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
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
          <div key={animKey} className="animate-fade-in">
            {/* Mobile: 2-column grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:hidden">
              {filteredProducts.slice(0, 6).map((product: any, i: number) => (
                <div key={product.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
                  <ProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
            {/* Tablet+ grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.slice(0, 8).map((product: any, i: number) => (
                <div key={product.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
                  <ProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <Link
              to={viewAllLink}
              className="flex items-center justify-center w-full sm:w-auto sm:inline-flex gap-1.5 px-8 py-3.5 border-2 border-[#8a9a5b] text-[#5a6b2e] rounded-xl text-sm font-semibold hover:bg-[#6b7c3e] hover:text-white hover:border-[#6b7c3e] transition-all duration-300 shadow-sm hover:shadow-md"
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

/* Premium product card */
const ProductCard = memo(({ product, formatPrice }: { product: any; formatPrice: (n: number) => string }) => {
  const imgSrc = product.image_url || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;
  const origPrice = product.original_price;
  const hasDiscount = origPrice && origPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / origPrice) * 100) : 0;
  const rating = product.rating;
  const isBestSeller = product.is_featured;

  return (
    <Link
      to={linkTo}
      className="group bg-white rounded-xl overflow-hidden flex flex-col shadow-[0_1px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#f8f7f4]">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />
        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {discountPct}% OFF
          </span>
        )}
        {/* Delivery badge */}
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-[9px] sm:text-[10px] font-medium px-2 py-1 rounded-lg flex items-center gap-1 text-foreground/80 shadow-sm">
            🕐 {product.delivery_time}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 sm:px-3 pt-2.5 pb-3.5 flex flex-col gap-1 flex-1">
        <h3 className="font-sans text-[12px] sm:text-[13px] font-medium text-foreground/85 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[15px] sm:text-[16px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] sm:text-[12px] text-muted-foreground line-through">
              {formatPrice(origPrice)}
            </span>
          )}
        </div>

        {/* Rating */}
        {rating && rating > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-[2px] rounded">
              <span className="text-[10px] font-bold leading-none">{rating.toFixed(1)}</span>
              <Star size={8} className="fill-white text-white" />
            </div>
            {product.review_count > 0 && (
              <span className="text-[10px] text-muted-foreground">
                ({product.review_count})
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {hasDiscount ? (
          <span className="inline-block self-start text-[8px] sm:text-[9px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 rounded-md mt-1 uppercase tracking-wider">
            Price Drop
          </span>
        ) : isBestSeller ? (
          <span className="inline-block self-start text-[8px] sm:text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mt-1 uppercase tracking-wider">
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
