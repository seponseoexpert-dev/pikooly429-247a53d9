import { useState, useMemo, useEffect, memo } from "react";
import ProductCard from "@/components/product/ProductCard";

import { Link } from "react-router-dom";
import { ChevronRight, Gift, Heart, Zap, Star, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductGrid = memo(() => {
  const [activeTailoredSlug, setActiveTailoredSlug] = useState("");
  const [activeTrendingTab, setActiveTrendingTab] = useState("for-you");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

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

  const { data: allSubcategories = [] } = useQuery({
    queryKey: ["homepage-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, slug, image_url, category_id")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const tailoredTabs = useMemo(() => {
    const getFallbackImage = (slug: string, type: "cat" | "sub") => {
      if (type === "cat") {
        const matchedProduct = products.find((p: any) => {
          return p.categories?.slug === slug || p.product_categories?.some((pc: any) => pc.categories?.slug === slug);
        });
        return matchedProduct?.image_url || matchedProduct?.images?.[0] || null;
      }
      // For subcategory, find product with matching subcategory
      const sub = allSubcategories.find((s: any) => s.slug === slug);
      if (!sub) return null;
      const matchedProduct = products.find((p: any) =>
        (p as any).subcategory_id === sub.id || (p as any).product_subcategories?.some((psc: any) => psc.subcategory_id === sub.id)
      );
      return matchedProduct?.image_url || matchedProduct?.images?.[0] || null;
    };

    const catTabs = occasionCategories.map((c) => ({
      label: c.name,
      slug: c.slug,
      imageUrl: c.image_url || getFallbackImage(c.slug, "cat"),
      icon: Gift,
      type: "cat" as const,
    }));

    // Add subcategories that belong to tailored parent categories
    const tailoredCatIds = new Set(occasionCategories.map((c) => c.id));
    const subTabs = allSubcategories
      .filter((s: any) => !tailoredCatIds.has(s.category_id))
      .map((s: any) => ({
        label: s.name,
        slug: s.slug,
        imageUrl: s.image_url || getFallbackImage(s.slug, "sub"),
        icon: Gift,
        type: "sub" as const,
        subId: s.id,
      }));

    // Show all subcategories as tabs alongside tailored categories
    return [...catTabs, ...subTabs];
  }, [occasionCategories, allSubcategories, products]);

  useEffect(() => {
    if (!tailoredTabs.length) {
      setActiveTailoredSlug("");
      return;
    }

    setActiveTailoredSlug((prev) =>
      prev && tailoredTabs.some((tab) => tab.slug === prev) ? prev : tailoredTabs[0].slug
    );
  }, [tailoredTabs]);

  const trendingTabs = [
    { id: "for-you", label: "For You", icon: Heart },
    { id: "best", label: "Best Seller", icon: Zap },
  ];

  const featured = products.filter((p: any) => p.is_featured);
  const displayFeatured = useMemo(() => {
    if (activeTrendingTab === "featured") {
      return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);
    }
    if (activeTrendingTab === "new") {
      return [...products].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    }
    if (activeTrendingTab === "best") {
      return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 10);
    }
    return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);
  }, [products, featured, activeTrendingTab]);

  const filtered = activeTailoredSlug
    ? products.filter((p: any) => {
        if (p.categories?.slug === activeTailoredSlug) return true;
        if (p.product_categories?.some((pc: any) => pc.categories?.slug === activeTailoredSlug)) return true;
        return false;
      })
    : products;

  const activeTailoredTab = tailoredTabs.find((tab) => tab.slug === activeTailoredSlug);
  const viewAllTailoredText = activeTailoredTab ? `View All ${activeTailoredTab.label} →` : "View All Gifts →";
  const viewAllTailoredLink = activeTailoredTab ? `/shop?cat=${activeTailoredTab.slug}` : "/shop";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style" }}>
      {/* Trending Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {trendingTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTrendingTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeTrendingTab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Icon size={14} className={activeTrendingTab === id ? "fill-primary-foreground" : ""} />
            {label}
          </button>
        ))}
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : displayFeatured.map((product: any, index: number) => (
              <div key={product.id} className={index >= 6 ? "hidden lg:block" : ""}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      <div className="mt-8 sm:mt-10 md:mt-12 mb-4 md:mb-6 text-center">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-1 md:mb-2">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Find the perfect gift for every moment</p>
      </div>

      {tailoredTabs.length > 0 && (
        <div className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto pb-4 mb-5 md:mb-7 scrollbar-hide justify-start sm:justify-center px-2">
          {tailoredTabs.map(({ label, slug, imageUrl, icon: Icon }) => {
            const isActive = activeTailoredSlug === slug;
            return (
              <button
                key={slug}
                onClick={() => setActiveTailoredSlug(slug)}
                className="flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[85px] group relative"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-250 shadow-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-card border border-border/60 text-muted-foreground group-hover:border-primary/40 group-hover:shadow-md group-hover:scale-[1.03]"
                }`}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={label}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover transition-all ${isActive ? "brightness-0 invert" : ""}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Icon size={26} className="sm:w-7 sm:h-7" />
                  )}
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : filtered.slice(0, 10).map((product: any, index: number) => (
              <div key={product.id} className={index >= 6 ? "hidden lg:block" : ""}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {filtered.length > 0 && (
        <div className="text-center mt-6 md:mt-8">
          <Link
            to={viewAllTailoredLink}
            className="inline-block px-8 sm:px-10 py-3 sm:py-3.5 border-2 border-primary text-primary rounded-full text-sm sm:text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {viewAllTailoredText}
          </Link>
        </div>
      )}
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
