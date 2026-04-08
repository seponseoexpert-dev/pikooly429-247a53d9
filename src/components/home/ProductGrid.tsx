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
    if (!occasionCategories.length) {
      setActiveTailoredSlug("");
      return;
    }
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
      id: `sub-${s.slug}`,
      label: s.name,
      icon: null,
      imageUrl: s.image_url || null,
      type: "sub" as const,
      subId: s.id,
      slug: s.slug,
    }));
    return [...baseTabs, ...subTabs];
  }, [tailoredSubcategories, settings]);

  const featured = products.filter((p: any) => p.is_featured);

  const trendingProducts = useMemo(() => {
    const tab = allTrendingTabs.find((t) => t.id === activeTab);
    if (!tab) return featured.length > 0 ? featured.slice(0, 12) : products.slice(0, 12);

    if (tab.type === "trending") {
      if (tab.id === "best") {
        return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 12);
      }
      return featured.length > 0 ? featured.slice(0, 12) : products.slice(0, 12);
    }

    if (tab.type === "sub" && "subId" in tab) {
      return products.filter((p: any) =>
        p.subcategory_id === tab.subId ||
        p.product_subcategories?.some((psc: any) => psc.subcategory_id === tab.subId)
      ).slice(0, 12);
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
  const trendingViewAllLink = activeTabData?.type === "sub" && "slug" in activeTabData
    ? `/product-category/${activeTabData.slug}`
    : "/shop";
  const trendingViewAllText = activeTabData?.type === "sub"
    ? `View All ${activeTabData.label}`
    : "View All";

  return (
    <section className="py-5 sm:py-7 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style" }}>
      {/* Trending Tabs */}
      <CategoryTabs
        tabs={allTrendingTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {productsLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : trendingProducts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Gift className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No products found in this category</p>
        </div>
      ) : (
        <ProductCarousel>
          {trendingProducts.map((product: any) => (
            <div
              key={product.id}
              className="flex-shrink-0 snap-start w-[150px] sm:w-[170px] md:w-[195px] lg:w-[210px] xl:w-[220px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </ProductCarousel>
      )}

      {trendingProducts.length > 0 && (
        <div className="text-center mt-5 sm:mt-7">
          <Link
            to={trendingViewAllLink}
            className="inline-block px-7 py-2.5 border border-foreground/15 text-foreground rounded-full text-[13px] font-medium hover:bg-foreground hover:text-background transition-all duration-300"
          >
            {trendingViewAllText} →
          </Link>
        </div>
      )}

      <div className="mt-10 sm:mt-12 md:mt-14 lg:mt-16 mb-4 md:mb-6 text-center">
        <h2 className="section-heading font-display font-semibold text-foreground mb-1">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-[13px]">Find the perfect gift for every moment</p>
      </div>

      {occasionCategories.length > 0 && (
        <div className="flex gap-3 sm:gap-5 md:gap-6 overflow-x-auto pb-3 mb-5 md:mb-7 scrollbar-hide justify-start sm:justify-center px-1">
          {occasionCategories.map((cat) => {
            const isActive = activeTailoredSlug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveTailoredSlug(cat.slug)}
                className="flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[72px] group relative"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                }`}>
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded object-cover transition-all ${isActive ? "brightness-0 invert" : ""}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Gift size={20} />
                  )}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {cat.name}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {productsLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tailoredProducts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Gift className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No products found for this occasion</p>
        </div>
      ) : (
        <ProductCarousel>
          {tailoredProducts.slice(0, 12).map((product: any) => (
            <div
              key={product.id}
              className="flex-shrink-0 snap-start w-[150px] sm:w-[170px] md:w-[195px] lg:w-[210px] xl:w-[220px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </ProductCarousel>
      )}

      {tailoredProducts.length > 0 && (
        <div className="text-center mt-5 sm:mt-7">
          <Link
            to={viewAllTailoredLink}
            className="inline-block px-7 py-2.5 border border-foreground/15 text-foreground rounded-full text-[13px] font-medium hover:bg-foreground hover:text-background transition-all duration-300"
          >
            {viewAllTailoredText} →
          </Link>
        </div>
      )}
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
