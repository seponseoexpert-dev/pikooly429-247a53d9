import { useState, useMemo, memo } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { Heart, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductGrid = memo(() => {
  const [activeTab, setActiveTab] = useState("for-you");

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

  // Build all tabs: For You, Best Seller + subcategory tabs
  const allTabs = useMemo(() => {
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

  const displayProducts = useMemo(() => {
    const tab = allTabs.find((t) => t.id === activeTab);
    if (!tab) return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);

    if (tab.type === "trending") {
      if (tab.id === "best") {
        return [...products].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 10);
      }
      // for-you = featured
      return featured.length > 0 ? featured.slice(0, 10) : products.slice(0, 10);
    }

    // Subcategory filter
    if (tab.type === "sub" && "subId" in tab) {
      const subId = tab.subId;
      const filtered = products.filter((p: any) =>
        p.subcategory_id === subId ||
        p.product_subcategories?.some((psc: any) => psc.subcategory_id === subId)
      );
      return filtered.slice(0, 10);
    }

    return products.slice(0, 10);
  }, [products, featured, activeTab, allTabs]);

  // View All link
  const activeTabData = allTabs.find((t) => t.id === activeTab);
  const viewAllLink = activeTabData?.type === "sub" && "slug" in activeTabData
    ? `/product-category/${activeTabData.slug}`
    : "/shop";
  const viewAllText = activeTabData?.type === "sub"
    ? `View All ${activeTabData.label} →`
    : "View All →";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Products" style={{ contain: "layout style" }}>
      {/* Tabs: For You, Best Seller + Subcategory tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {allTabs.map((tab) => (
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
          : displayProducts.map((product: any, index: number) => (
              <div key={product.id} className={index >= 6 ? "hidden lg:block" : ""}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {displayProducts.length > 0 && (
        <div className="text-center mt-6 md:mt-8">
          <Link
            to={viewAllLink}
            className="inline-block px-8 sm:px-10 py-3 sm:py-3.5 border-2 border-primary text-primary rounded-full text-sm sm:text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {viewAllText}
          </Link>
        </div>
      )}
    </section>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
