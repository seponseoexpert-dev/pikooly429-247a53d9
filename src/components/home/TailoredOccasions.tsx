import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star, ChevronRight, ShoppingCart, Clock } from "lucide-react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";

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

  const tailoredCatIds = useMemo(() => occasionCategories.map((c) => c.id), [occasionCategories]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tailored-occasion-products", tailoredCatIds],
    queryFn: async () => {
      if (!tailoredCatIds.length) return [];
      
      // Step 1: Get product IDs from junction table for tailored categories
      const { data: junctionData } = await supabase
        .from("product_categories")
        .select("product_id")
        .in("category_id", tailoredCatIds);
      
      // Step 2: Get product IDs from direct category_id
      const { data: directData } = await supabase
        .from("products")
        .select("id")
        .eq("is_active", true)
        .in("category_id", tailoredCatIds);
      
      // Combine unique product IDs
      const productIds = [...new Set([
        ...(junctionData || []).map((j: any) => j.product_id),
        ...(directData || []).map((d: any) => d.id),
      ])];
      
      if (!productIds.length) return [];
      
      // Step 3: Fetch full product data
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug))")
        .eq("is_active", true)
        .in("id", productIds)
        .order("created_at", { ascending: false })
        .limit(60);
      
      if (error) throw error;
      return data || [];
    },
    enabled: tailoredCatIds.length > 0,
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
          <div key={animKey} className="motion-safe:animate-fade-in-up">
            {/* Horizontal scroll - FNP style */}
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
              {filteredProducts.slice(0, 12).map((product: any, i: number) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="min-w-[44vw] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] max-w-[240px] snap-start shrink-0 motion-safe:animate-fade-in-up"
                >
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

/* FNP-style horizontal product card with Buy Now + Cart */
const ProductCard = memo(({ product, formatPrice }: { product: any; formatPrice: (n: number) => string }) => {
  const imgSrc = product.image_url || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price,
      image: imgSrc,
      category: product.categories?.name || "",
      inStock: product.stock > 0,
      rating: product.rating,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        image: imgSrc,
        category: product.categories?.name || "",
        inStock: product.stock > 0,
        rating: product.rating,
      },
      undefined,
      true
    );
    navigate("/checkout");
  };

  return (
    <Link
      to={linkTo}
      className="group bg-white rounded-lg overflow-hidden flex flex-col border-2 border-border hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      {/* Image - taller aspect */}
      <div className="relative aspect-square overflow-hidden bg-[#f8f7f4]">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={300}
          height={375}
        />
        {/* Delivery badge */}
        {product.delivery_time && (
          <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 text-foreground/80 shadow-md">
            <Clock size={13} strokeWidth={2} className="text-foreground/60" />
            {product.delivery_time}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-3 flex flex-col gap-1 flex-1">
        {/* Product name */}
        <h3 className="font-sans text-[12px] sm:text-[13px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[32px]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[14px] sm:text-[16px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Buy Now + Cart buttons */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-[#5a6b2e] hover:bg-[#4a5a24] text-white text-[11px] sm:text-[12px] font-semibold py-2 px-3 rounded-full transition-all duration-200 active:scale-95"
          >
            Buy Now
          </button>
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-[#5a6b2e] text-[#5a6b2e] hover:bg-[#5a6b2e] hover:text-white transition-all duration-200 active:scale-95 shrink-0"
          >
            <ShoppingCart size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </Link>
  );
});

TailoredOccasions.displayName = "TailoredOccasions";
ProductCard.displayName = "ProductCard";

export default TailoredOccasions;
