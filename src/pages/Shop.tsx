import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { products, categories } from "@/data/mockData";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("cat") || "";
  const [selectedCat, setSelectedCat] = useState(catParam);

  useEffect(() => {
    setSelectedCat(catParam);
  }, [catParam]);
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let list = selectedCat
      ? products.filter((p) => p.category === selectedCat)
      : products;

    switch (sortBy) {
      case "price-low": return [...list].sort((a, b) => a.price - b.price);
      case "price-high": return [...list].sort((a, b) => b.price - a.price);
      case "rating": return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: return list;
    }
  }, [selectedCat, sortBy]);

  return (
    <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Shop</h1>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCat === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-muted border-none rounded-lg px-3 py-2 outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No products found in this category.</p>
        </div>
      )}
    </main>
  );
};

export default Shop;