import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "@/components/product/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("cat") || "";
  const [selectedCat, setSelectedCat] = useState(catParam);

  useEffect(() => {
    setSelectedCat(catParam);
  }, [catParam]);
  const [sortBy, setSortBy] = useState("newest");

  const { data: products = [] } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const activeCategoryName = useMemo(() => {
    if (!selectedCat) return "All Products";
    const cat = categories.find((c: any) => c.slug === selectedCat);
    return cat?.name || "All Products";
  }, [selectedCat, categories]);

  const filtered = useMemo(() => {
    let list = selectedCat
      ? products.filter((p: any) => p.categories?.slug === selectedCat)
      : products;

    switch (sortBy) {
      case "price-low": return [...list].sort((a: any, b: any) => a.price - b.price);
      case "price-high": return [...list].sort((a: any, b: any) => b.price - a.price);
      case "rating": return [...list].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      default: return list;
    }
  }, [selectedCat, sortBy, products]);

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      {/* Breadcrumb + Sort row */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{activeCategoryName}</span>
        </nav>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs sm:text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none text-foreground cursor-pointer"
        >
          <option value="newest">Default sorting</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Category pills - only show if no specific category is selected */}
      {!catParam && (
        <div className="flex gap-2 overflow-x-auto mb-5 md:mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${selectedCat === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {filtered.map((product: any, i: number) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm sm:text-base md:text-lg">No products found in this category.</p>
        </div>
      )}
    </main>
  );
};

export default Shop;
