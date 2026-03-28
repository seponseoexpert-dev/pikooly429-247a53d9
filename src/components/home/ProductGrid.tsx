import { useState, useMemo, useEffect, memo } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { Gift, Heart, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductGrid = memo(() => {
  const [activeTab, setActiveTab] = useState("for-you");
  const [activeTailoredSlug, setActiveTailoredSlug] = useState("");

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

  // Tailored occasion categories (Anniversary, Wedding, etc.)
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

  // Subcategories for trending tabs (Rose Bouquet, Lily Bouquet, etc.)
  const { data: tailoredSubcategories = [] } = useQuery({
    queryKey: ["homepage-subcategories-tailored"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("subcategories")
        .select("id, name, slug, image_url, category_id") as any)
        .eq("is_active", true)
        .eq("show_in_tailored", true)
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Set default tailored tab
  useEffect(() => {
    if (!occasionCategories.length) {
      setActiveTailoredSlug("");
      return;
    }
    setActiveTailoredSlug((prev) =>
      prev && occasionCategories.some((c) => c.slug === prev) ? prev : occasionCategories[0].slug
    );
  }, [occasionCategories]);

  // ── Trending tabs: For You, Best Seller + subcategory tabs ──
  const allTrendingTabs = useMemo(() => {
    const baseTabs = [
      { id: "for-you", label: "For You", icon: Heart, type: "trending" as const },
      { id: "best", label: "Best Seller", icon: Zap, type: "trending" as const },
    ];
    const subTabs = tailoredSubcategories.map((s: any) => ({
      id: `sub-${s.slug}`,
      label: s.name,
      icon: null,
      type: "sub" as const,
      subId: s.id,
      slug: s.slug,
    }));
    return [...baseTabs, ...subTabs];
  }, [tailoredSubcategories]);

  const featured = products.filter((p: any) => p.is_featured);

  const trendingProducts = useMemo(() => {
    const tab = allTrendingTabs.find((t) => t.id === activeTab);
    if (!tab) return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);

    if (tab.type === "trending") {
      if (tab.id === "best") {
        return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 10);
      }
      return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);
    }

    if (tab.type === "sub" && "subId" in tab) {
      return products.filter((p: any) =>
        p.subcategory_id === tab.subId ||
        p.product_subcategories?.some((psc: any) => psc.subcategory_id === tab.subId)
      ).slice(0, 10);
    }

    return products.slice(0, 10);
  }, [products, featured, activeTab, allTrendingTabs]);

  // ── Tailored section products (by occasion category) ──
  const tailoredProducts = useMemo(() => {
    if (!activeTailoredSlug) return products;
    return products.filter((p: any) => {
      if (p.categories?.slug === activeTailoredSlug) return true;
      if (p.product_categories?.some((pc: any) => pc.categories?.slug === activeTailoredSlug)) return true;
      return false;
    });
  }, [activeTailoredSlug, products]);

  const activeTailoredCat = occasionCategories.find((c) => c.slug === activeTailoredSlug);
  const viewAllTailoredLink = activeTailoredCat ? `/shop?cat=${activeTailoredCat.slug}` : "/shop";
  const viewAllTailoredText = activeTailoredCat ? `View All ${activeTailoredCat.name} →` : "View All Gifts →";

  // Trending tab view all link
  const activeTabData = allTrendingTabs.find((t) => t.id === activeTab);
  const trendingViewAllLink = activeTabData?.type === "sub" && "slug" in activeTabData
    ? `/product-category/${activeTabData.slug}`
    : "/shop";
  const trendingViewAllText = activeTabData?.type === "sub"
    ? `View All ${activeTabData.label} →`
    : "View All →";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style" }}>
      {/* ── Trending Tabs: For You, Best Seller + Subcategories ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {allTrendingTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.icon && <tab.icon size={14} className={activeTab === tab.id ? "fill-primary-foreground" : ""} />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : trendingProducts.map((product: any, index: number) => (
              <div key={product.id} className={index >= 6 ? "hidden lg:block" : ""}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {trendingProducts.length > 0 && (
        <div className="text-center mt-6 md:mt-8">
          <Link
            to={trendingViewAllLink}
            className="inline-block px-8 sm:px-10 py-3 sm:py-3.5 border-2 border-primary text-primary rounded-full text-sm sm:text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {trendingViewAllText}
          </Link>
        </div>
      )}

      {/* ── Tailored For Your Occasions (Categories only) ── */}
      <div className="mt-8 sm:mt-10 md:mt-12 mb-4 md:mb-6 text-center">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-1 md:mb-2">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Find the perfect gift for every moment</p>
      </div>

      {occasionCategories.length > 0 && (
        <div className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto pb-4 mb-5 md:mb-7 scrollbar-hide justify-start sm:justify-center px-2">
          {occasionCategories.map((cat) => {
            const isActive = activeTailoredSlug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveTailoredSlug(cat.slug)}
                className="flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[85px] group relative"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-250 shadow-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-card border border-border/60 text-muted-foreground group-hover:border-primary/40 group-hover:shadow-md group-hover:scale-[1.03]"
                }`}>
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover transition-all ${isActive ? "brightness-0 invert" : ""}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Gift size={26} className="sm:w-7 sm:h-7" />
                  )}
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {cat.name}
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
          : tailoredProducts.slice(0, 10).map((product: any, index: number) => (
              <div key={product.id} className={index >= 6 ? "hidden lg:block" : ""}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {tailoredProducts.length > 0 && (
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
