import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const CategoryGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-4 md:py-10 section-container" aria-label="Shop by Category">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex-shrink-0"
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 group w-20 md:w-24"
            >
              <div className="relative">
                {cat.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[8px] font-bold uppercase bg-destructive text-destructive-foreground rounded-full whitespace-nowrap">
                    {cat.badge}
                  </span>
                )}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-secondary border border-border/30 group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">{cat.icon}</span>
                </div>
              </div>
              <span className="text-[11px] md:text-xs font-medium text-foreground/70 group-hover:text-primary transition-colors text-center leading-tight whitespace-pre-line">
                {cat.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
