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
      // Tailored section: include any category marked with "tailored" type,
      // regardless of "Show in Homepage" toggle (Tailored tick is itself the intent)
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, category_type, category_types")
        .eq("is_active", true)
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

  const { data: tailoredSubcategories = [] } = useQuery({
    queryKey: ["homepage-tailored-subcategories"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("subcategories")
        .select("id, name, slug, image_url, category_id") as any)
        .eq("is_active", true)
        .eq("show_in_tailored", true)
        .order("display_order");
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Unified tab list: categories + subcategories
  const occasionTabs = useMemo(() => {
    const catTabs = occasionCategories.map((c: any) => ({
      key: `cat-${c.slug}`, kind: "cat" as const, id: c.id, name: c.name, slug: c.slug, image_url: c.image_url,
    }));
    const subTabs = tailoredSubcategories.map((s: any) => ({
      key: `sub-${s.slug}`, kind: "sub" as const, id: s.id, name: s.name, slug: s.slug, image_url: s.image_url,
    }));
    return [...catTabs, ...subTabs];
  }, [occasionCategories, tailoredSubcategories]);

  const tailoredCatIds = useMemo(() => occasionCategories.map((c) => c.id), [occasionCategories]);
  const tailoredSubIds = useMemo(() => tailoredSubcategories.map((s: any) => s.id), [tailoredSubcategories]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tailored-occasion-products", tailoredCatIds, tailoredSubIds],
    queryFn: async () => {
      if (!tailoredCatIds.length && !tailoredSubIds.length) return [];

      const productIdSet = new Set<string>();

      // Products linked to tailored categories (junction + direct)
      if (tailoredCatIds.length) {
        const [junctionRes, directRes] = await Promise.all([
          supabase.from("product_categories").select("product_id").in("category_id", tailoredCatIds),
          supabase.from("products").select("id").eq("is_active", true).in("category_id", tailoredCatIds),
        ]);
        (junctionRes.data || []).forEach((j: any) => productIdSet.add(j.product_id));
        (directRes.data || []).forEach((d: any) => productIdSet.add(d.id));
      }

      // Products linked to tailored subcategories (junction + direct)
      if (tailoredSubIds.length) {
        const [subJunctionRes, subDirectRes] = await Promise.all([
          supabase.from("product_subcategories").select("product_id").in("subcategory_id", tailoredSubIds),
          supabase.from("products").select("id").eq("is_active", true).in("subcategory_id", tailoredSubIds),
        ]);
        (subJunctionRes.data || []).forEach((j: any) => productIdSet.add(j.product_id));
        (subDirectRes.data || []).forEach((d: any) => productIdSet.add(d.id));
      }

      const productIds = Array.from(productIdSet);
      if (!productIds.length) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id, subcategories(slug))")
        .eq("is_active", true)
        .in("id", productIds)
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      return data || [];
    },
    enabled: tailoredCatIds.length > 0 || tailoredSubIds.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!occasionTabs.length) { setActiveSlug(""); return; }
    setActiveSlug((prev) =>
      prev && occasionTabs.some((t) => t.slug === prev) ? prev : occasionTabs[0].slug
    );
  }, [occasionTabs]);

  const activeTab = useMemo(() => occasionTabs.find((t) => t.slug === activeSlug), [occasionTabs, activeSlug]);

  const filteredProducts = useMemo(() => {
    if (!activeTab) return products;
    if (activeTab.kind === "cat") {
      return products.filter((p: any) => {
        if (p.categories?.slug === activeTab.slug) return true;
        if (p.product_categories?.some((pc: any) => pc.categories?.slug === activeTab.slug)) return true;
        return false;
      });
    }
    // subcategory tab
    return products.filter((p: any) => {
      if (p.product_subcategories?.some((ps: any) => ps.subcategories?.slug === activeTab.slug || ps.subcategory_id === activeTab.id)) return true;
      return false;
    });
  }, [activeTab, products]);

  const viewAllLink = activeTab
    ? activeTab.kind === "cat"
      ? `/shop?cat=${activeTab.slug}`
      : `/shop?sub=${activeTab.slug}`
    : "/shop";
  const viewAllText = activeTab ? `View All ${activeTab.name} Gifts` : "View All Gifts";

  if (occasionTabs.length === 0 && !isLoading) return null;

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
        {occasionTabs.length > 0 && (
          <div className="relative mb-4 sm:mb-5">
            {/* Bottom hairline that the active tab sits on */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[hsl(var(--border))]" />
            <div className="flex overflow-x-auto scrollbar-hide gap-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {occasionTabs.map((tab) => {
                const isActive = activeSlug === tab.slug;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.slug)}
                    aria-pressed={isActive}
                    className={`group relative flex flex-col items-center justify-end gap-1.5 pt-3 pb-3 px-3 sm:px-4 shrink-0 w-[88px] sm:w-[110px] transition-colors duration-200 ${
                      isActive
                        ? "bg-[hsl(var(--ivory))] rounded-t-xl border-t-2 border-x border-[hsl(var(--primary))] border-b-0 -mb-px"
                        : "border-b border-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center h-9 sm:h-10">
                      {tab.image_url ? (
                        <img
                          src={getOptimizedCloudinaryUrl(tab.image_url, 96)}
                          alt={tab.name}
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
                      {tab.name}
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
            {/* Mobile: 2-column grid */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {filteredProducts.slice(0, 8).map((product: any, i: number) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="motion-safe:animate-fade-in-up"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {/* Tablet/Desktop: horizontal scroll */}
            <div className="hidden sm:flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
              {filteredProducts.slice(0, 12).map((product: any, i: number) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="sm:w-[200px] sm:min-w-[200px] sm:max-w-[200px] md:w-[220px] md:min-w-[220px] md:max-w-[220px] lg:w-[240px] lg:min-w-[240px] lg:max-w-[240px] snap-start shrink-0 motion-safe:animate-fade-in-up"
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
