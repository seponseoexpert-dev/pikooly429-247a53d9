import { useMemo, memo } from "react";
import ProductCard from "@/components/product/ProductCard";
import ProductCarousel from "@/components/home/ProductCarousel";
import { Link } from "react-router-dom";
import { Gift, Heart, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ProductGrid = memo(() => {
  const { settings } = useSiteSettings();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, image_url, rating, stock, is_featured, delivery_time, category_id, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(30);
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
    const tab = allTrendingTabs.find((t) => t.id === "for-you");
    if (!tab) return products.slice(0, 12);
    const featuredIds = new Set(featured.map((p: any) => p.id));
    const rest = products.filter((p: any) => !featuredIds.has(p.id));
    return [...featured, ...rest].slice(0, 12);
  }, [products, featured, allTrendingTabs]);

  const cardWidthClass = "w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[210px]";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style", contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Trending Items</h2>
          <div className="w-12 h-[3px] bg-primary mt-1.5 rounded-full" />
        </div>
        <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
          View More »
        </Link>
      </div>

      {productsLoading ? (
        <div className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
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
        <>
          <div className="hidden lg:grid grid-cols-5 gap-4">
            {trendingProducts.slice(0, 5).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="lg:hidden">
            <ProductCarousel>
              {trendingProducts.slice(0, 10).map((product: any) => (
                <div key={product.id} className={`flex-shrink-0 snap-start ${cardWidthClass}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </ProductCarousel>
          </div>
        </>
      )}
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
