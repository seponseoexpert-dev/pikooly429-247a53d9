import { useState } from "react";
import { products } from "@/data/mockData";
import ProductCard from "@/components/product/ProductCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp, Gift, Heart, Cake } from "lucide-react";

const tabs = [
  { label: "Trending", icon: TrendingUp },
  { label: "Birthday", icon: Gift },
  { label: "Anniversary", icon: Heart },
  { label: "Cakes", icon: Cake },
];

const ProductGrid = () => {
  const [activeTab, setActiveTab] = useState("Trending");
  const { ref, isVisible } = useScrollAnimation();

  const filtered = activeTab === "Trending"
    ? products
    : products.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <section ref={ref} className="py-6 sm:py-8 md:py-10 lg:py-14 section-container" aria-label="Products">
      {/* Trending Gifts header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground">
          Trending Gifts
        </h2>
        <Link
          to="/shop"
          className="flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          VIEW ALL <ChevronRight size={16} />
        </Link>
      </div>

      {/* Grid - first 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {products.slice(0, 4).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* Stats bar */}
      <div className="my-6 sm:my-8 md:my-10 lg:my-12 bg-secondary rounded-2xl py-4 sm:py-5 md:py-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-12">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-lg sm:text-xl">⭐</span>
          <span className="font-semibold text-sm sm:text-base">Rated 4.8/5</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-lg sm:text-xl">👥</span>
          <span className="font-semibold text-sm sm:text-base">4,62,543+ Happy Customers</span>
        </div>
      </div>

      {/* Tailored For Your Occasions */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-1 md:mb-2">
          Tailored For Your Occasions
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Find the perfect gift for every moment</p>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-4 md:mb-6 scrollbar-hide">
        {tabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
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

      {/* Filtered grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      <div className="text-center mt-6 md:mt-8">
        <Link
          to="/shop"
          className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-primary text-primary rounded-full text-xs sm:text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
        >
          View All Trending Gifts →
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;
