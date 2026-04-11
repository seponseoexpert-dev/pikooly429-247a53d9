import { useState, useMemo, useEffect, memo } from "react";
import ProductCard from "@/components/product/ProductCard";
import ProductCarousel from "@/components/home/ProductCarousel";
import CategoryTabs from "@/components/home/CategoryTabs";
import { Link } from "react-router-dom";
import { Gift, Heart, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ProductGrid = memo(() => {
  const [activeTab, setActiveTab] = useState("for-you");
  const [activeTailoredSlug, setActiveTailoredSlug] = useState("");
  const { settings } = useSiteSettings();

  const { data: products = [], isLoading: productsLoading } = useQuery({
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

  useEffect(() => {
    if (!occasionCategories.length) { setActiveTailoredSlug(""); return; }
    setActiveTailoredSlug((prev) =>
      prev && occasionCategories.some((c) => c.slug === prev) ? prev : occasionCategories[0].slug
    );
  }, [occasionCategories]);

  const allTrendingTabs = useMemo(() => {
    const forYouIcon = settings.trending_tab_foryou_icon || null;
    const bestSellerIcon = settings.trending_tab_bestseller_icon || null;
    const baseTabs = [
      { id: "for-you", label: "For You", icon: forYouIcon ? null : Heart, imageUrl: forYouIcon, type: "trending" as const },
      { id: "best", label: "Best Seller", icon: bestSellerIcon ? null : Zap, imageUrl: bestSellerIcon, type: "trending" as const },
    ];
    const subTabs = tailoredSubcategories.map((s: any) => ({
      id: `sub-${s.slug}`, label: s.name, icon: null, imageUrl: s.image_url || null, type: "sub" as const, subId: s.id, slug: s.slug,
    }));
    return [...baseTabs, ...subTabs];
  }, [tailoredSubcategories, settings]);

  const featured = products.filter((p: any) => p.is_featured);

  const trendingProducts = useMemo(() => {
    const tab = allTrendingTabs.find((t) => t.id === activeTab);
    if (!tab) return featured.length > 0 ? featured.slice(0, 12) : products.slice(0, 12);
    if (tab.type === "trending") {
      if (tab.id === "best") return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 12);
      return featured.length > 0 ? featured.slice(0, 12) : products.slice(0, 12);
    }
    if (tab.type === "sub" && "subId" in tab) {
      return products.filter((p: any) => p.subcategory_id === tab.subId || p.product_subcategories?.some((psc: any) => psc.subcategory_id === tab.subId)).slice(0, 12);
    }
    return products.slice(0, 12);
  }, [products, featured, activeTab, allTrendingTabs]);

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
  const viewAllTailoredText = activeTailoredCat ? `View All ${activeTailoredCat.name}` : "View All Gifts";

  const activeTabData = allTrendingTabs.find((t) => t.id === activeTab);
  const trendingViewAllLink = activeTabData?.type === "sub" && "slug" in activeTabData ? `/product-category/${activeTabData.slug}` : "/shop";
  const trendingViewAllText = activeTabData?.type === "sub" ? `View All ${activeTabData.label}` : "View All";

  // Fixed card widths for all breakpoints
  const cardWidthClass = "w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[210px]";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style", contentVisibility: "auto", containIntrinsicSize: "auto 800px" }}>
      <CategoryTabs tabs={allTrendingTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {productsLoading ? (
        <div className="py-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0">
                <div className="aspect-square rounded-xl bg-muted animate-pulse" />
                <div className="mt-2 h-3 w-3/4 rounded bg-muted animate-pulse" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : trendingProducts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Gift className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No products found in this category</p>
        </div>
      ) : (
        <ProductCarousel>
          {trendingProducts.map((product: any) => (
            <div key={product.id} className={`flex-shrink-0 snap-start ${cardWidthClass}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </ProductCarousel>
      )}

      {trendingProducts.length > 0 && (
        <div className="text-center mt-4 sm:mt-6">
          <Link to={trendingViewAllLink} className="inline-block px-6 py-2 border border-foreground/15 text-foreground rounded-full text-[12px] sm:text-[13px] font-medium hover:bg-foreground hover:text-background transition-all duration-300">
            {trendingViewAllText} →
          </Link>
        </div>
      )}

      <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-0 text-left section-container">
        <h2 className="section-heading font-display font-semibold text-foreground">Tailored For Your Occasions</h2>
      </div>

      {occasionCategories.length > 0 && (
        <div className="flex overflow-x-auto scrollbar-hide border-b border-border/50 mb-4 md:mb-6 section-container">
          {occasionCategories.map((cat) => {
            const isActive = activeTailoredSlug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveTailoredSlug(cat.slug)}
                className={`flex flex-col items-center gap-1.5 px-5 sm:px-7 md:px-8 py-3 sm:py-4 shrink-0 relative transition-all duration-200 rounded-t-lg border-b-2 -mb-[1px] ${
                  isActive
                    ? "border-primary text-foreground bg-muted/60"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" loading="lazy" decoding="async" />
                  ) : (
                    <Gift size={20} />
                  )}
                </div>
                <span className={`text-[11px] sm:text-[13px] whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-muted/30 rounded-xl py-4 sm:py-6 px-2 sm:px-4">
      {productsLoading ? (
        <div className="py-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0">
                <div className="aspect-square rounded-xl bg-muted animate-pulse" />
                <div className="mt-2 h-3 w-3/4 rounded bg-muted animate-pulse" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : tailoredProducts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Gift className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No products found for this occasion</p>
        </div>
      ) : (
        <ProductCarousel>
          {tailoredProducts.slice(0, 12).map((product: any) => (
            <div key={product.id} className={`flex-shrink-0 snap-start ${cardWidthClass}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </ProductCarousel>
      )}

      {tailoredProducts.length > 0 && (
        <div className="text-center mt-4 sm:mt-6">
          <Link to={viewAllTailoredLink} className="inline-block px-6 py-2 border border-foreground/15 text-foreground rounded-full text-[12px] sm:text-[13px] font-medium hover:bg-foreground hover:text-background transition-all duration-300">
            {viewAllTailoredText} →
          </Link>
        </div>
      )}
      </div>
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
