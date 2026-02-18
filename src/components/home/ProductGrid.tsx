import { useState } from "react";
import { products } from "@/data/mockData";
import ProductCard from "@/components/product/ProductCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tabs = ["All", "Flowers", "Cake", "Combos", "Birthday", "Perfumes"];

const ProductGrid = () => {
  const [activeTab, setActiveTab] = useState("All");
  const { ref, isVisible } = useScrollAnimation();

  const filtered = activeTab === "All"
    ? products
    : products.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <section ref={ref} className="py-12 md:py-16 section-container" aria-label="Products">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          New Arrivals
        </h2>
        <p className="text-muted-foreground">Freshly curated just for you</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide justify-start md:justify-center">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/shop">
          <Button variant="outline" size="lg" className="rounded-full px-10">
            View All Products
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;