import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";
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
    <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6">Shop</h1>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto flex-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${selectedCat === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs sm:text-sm bg-muted border-none rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-5">
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
