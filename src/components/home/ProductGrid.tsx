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
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug))")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: occasionCategories = [] } = useQuery({
    queryKey: ["homepage-occasion-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .eq("show_in_homepage", true)
        .eq("category_type", "tailored")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const tailoredTabs = useMemo(
    () =>
      occasionCategories.map((c) => ({
        label: c.name,
        slug: c.slug,
        icon: Gift,
      })),
    [occasionCategories]
  );

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
    { id: "featured", label: "Featured", icon: Star },
    { id: "new", label: "New Arrival", icon: Sparkles },
    { id: "best", label: "Best Seller", icon: Zap },
  ];

  const featured = products.filter((p: any) => p.is_featured);
  const displayFeatured = useMemo(() => {
    if (activeTrendingTab === "featured") {
      return featured.length > 0 ? featured.slice(0, 5) : products.slice(0, 5);
    }
    if (activeTrendingTab === "new") {
      return [...products].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    }
    if (activeTrendingTab === "best") {
      return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 5);
    }
    return featured.length > 0 ? featured.slice(0, 5) : products.slice(0, 5);
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

      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground">
          {trendingTabs.find(t => t.id === activeTrendingTab)?.label || "For You"}
        </h2>
        <Link to="/shop" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          View All {trendingTabs.find(t => t.id === activeTrendingTab)?.label || "For You"} <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : displayFeatured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      <div className="mt-8 sm:mt-10 md:mt-12 mb-4 md:mb-6 text-center">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-1 md:mb-2">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Find the perfect gift for every moment</p>
      </div>

      {tailoredTabs.length > 0 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-4 md:mb-6 scrollbar-hide justify-start sm:justify-center px-1">
          {tailoredTabs.map(({ label, slug, icon: Icon }) => (
            <button
              key={slug}
              onClick={() => setActiveTailoredSlug(slug)}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTailoredSlug === slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Icon size={14} className="sm:w-4 sm:h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : filtered.slice(0, 10).map((product: any) => (
              <ProductCard key={product.id} product={product} />
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
