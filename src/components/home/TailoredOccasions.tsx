import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { getOptimizedCloudinaryUrl } from "@/lib/imageUtils";

const TailoredOccasions = memo(() => {
  const [activeSlug, setActiveSlug] = useState("");
  const [animKey, setAnimKey] = useState(0);

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
        .select("id, name, slug, image_url, category_type, category_types")
        .eq("is_active", true)
        .eq("show_in_homepage", true)
        .order("display_order");
      if (error) throw error;
      return (data || []).filter((c: any) => {
        const types: string[] = (c.category_types && c.category_types.length > 0) ? c.category_types : [c.category_type].filter(Boolean);
        return types.includes("tailored");
      });
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
    <section className="bg-background py-6 sm:py-10 md:py-12" aria-label="Tailored For Your Occasions">
      <div className="section-container">
        {/* Title - FNP style: bold, left-aligned, no eyebrow */}
        <div className="mb-3 sm:mb-4">
          <h2 className="font-bold text-foreground tracking-tight" style={{ fontSize: "clamp(1.25rem, 2.2vw + 0.5rem, 2rem)" }}>
            Tailored For Your Occasions
          </h2>
        </div>

        {/* FNP-style folder-tab strip */}
        {occasionCategories.length > 0 && (
          <div className="relative mb-4 sm:mb-5">
            {/* Bottom hairline that the active tab sits on */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[hsl(var(--border))]" />
            <div className="flex overflow-x-auto scrollbar-hide gap-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {occasionCategories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleTabChange(cat.slug)}
                    aria-pressed={isActive}
                    className={`group relative flex flex-col items-center justify-end gap-1.5 pt-3 pb-3 px-3 sm:px-4 shrink-0 w-[88px] sm:w-[110px] transition-colors duration-200 ${
                      isActive
                        ? "bg-[hsl(var(--ivory))] rounded-t-xl border-t-2 border-x border-[hsl(var(--primary))] border-b-0 -mb-px"
                        : "border-b border-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center h-9 sm:h-10">
                      {cat.image_url ? (
                        <img
                          src={getOptimizedCloudinaryUrl(cat.image_url, 96)}
                          alt={cat.name}
                          className={`w-8 h-8 sm:w-9 sm:h-9 object-contain transition-opacity ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                          loading="lazy"
                          decoding="async"
                          width={36}
                          height={36}
                        />
                      ) : (
                        <Gift size={26} strokeWidth={1.5} className={isActive ? "text-[hsl(var(--primary))]" : "text-foreground/70"} />
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[12px] sm:text-[13px] leading-tight text-center line-clamp-1 transition-colors duration-200 ${
                        isActive ? "font-semibold text-[hsl(var(--primary))]" : "font-medium text-foreground/75 group-hover:text-foreground"
                      }`}
                    >
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
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {filteredProducts.slice(0, 12).map((product: any, i: number) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="w-[60%] min-w-[60%] max-w-[60%] sm:w-[200px] sm:min-w-[200px] sm:max-w-[200px] md:w-[220px] md:min-w-[220px] md:max-w-[220px] lg:w-[240px] lg:min-w-[240px] lg:max-w-[240px] snap-start shrink-0 motion-safe:animate-fade-in-up"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {filteredProducts.length > 0 && (
          <div className="mt-7 sm:mt-9 text-center">
            <Link
              to={viewAllLink}
              className="btn-luxe inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.16em] uppercase"
            >
              {viewAllText}
              <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
});

TailoredOccasions.displayName = "TailoredOccasions";

export default TailoredOccasions;
