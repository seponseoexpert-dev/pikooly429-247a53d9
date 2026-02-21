import { useState, useMemo, memo } from "react";
import ProductCard from "@/components/product/ProductCard";

import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductGrid = memo(() => {
  const [activeTab, setActiveTab] = useState("All");

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

  const { data: categories = [] } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .eq("show_in_homepage", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const dynamicTabs = useMemo(() => [
    { label: "All", icon: TrendingUp },
    ...categories.slice(0, 3).map((c) => ({
      label: c.name,
      slug: c.slug,
      icon: Gift,
    })),
  ], [categories]);

  const featured = products.filter((p: any) => p.is_featured);
  const displayFeatured = featured.length > 0 ? featured.slice(0, 5) : products.slice(0, 5);

  const filtered = activeTab === "All"
    ? products
    : products.filter((p: any) => {
        if (p.categories?.name === activeTab || p.categories?.slug === activeTab) return true;
        if (p.product_categories?.some((pc: any) => pc.categories?.name === activeTab || pc.categories?.slug === activeTab)) return true;
        return false;
      });

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container animate-fade-in" aria-label="Products">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground">
          Trending Gifts
        </h2>
        <Link to="/shop" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          VIEW ALL <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : displayFeatured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      <div className="my-4 sm:my-6 md:my-8 lg:my-10 bg-secondary rounded-2xl py-4 sm:py-5 md:py-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-12">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-lg sm:text-xl">⭐</span>
          <span className="font-semibold text-sm sm:text-base">Rated 4.8/5</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-lg sm:text-xl">👥</span>
          <span className="font-semibold text-sm sm:text-base">4,62,543+ Happy Customers</span>
        </div>
      </div>

      <div className="mb-4 md:mb-6 text-center">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-1 md:mb-2">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Find the perfect gift for every moment</p>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-4 md:mb-6 scrollbar-hide justify-start sm:justify-center px-1">
        {dynamicTabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
              activeTab === label
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Icon size={14} className="sm:w-4 sm:h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {productsLoading
          ? <div className="col-span-full flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          : filtered.slice(0, 10).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {products.length > 0 && (
        <div className="text-center mt-6 md:mt-8">
          <Link
            to="/shop"
            className="inline-block px-8 sm:px-10 py-3 sm:py-3.5 border-2 border-primary text-primary rounded-full text-sm sm:text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            View All Trending Gifts →
          </Link>
        </div>
      )}
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
