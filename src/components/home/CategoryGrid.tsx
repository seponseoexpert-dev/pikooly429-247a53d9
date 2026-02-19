import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const CategoryGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Shop by Category">
      <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto pb-2 scrollbar-hide md:justify-center md:flex-wrap md:overflow-visible">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex-shrink-0 md:flex-shrink"
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group w-[72px] sm:w-20 md:w-24 lg:w-28"
            >
              <div className="relative">
                {cat.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase bg-destructive text-destructive-foreground rounded-full whitespace-nowrap">
                    {cat.badge}
                  </span>
                )}
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-[88px] lg:h-[88px] rounded-2xl overflow-hidden bg-secondary border border-border/30 group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px]">{cat.icon}</span>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-medium text-foreground/70 group-hover:text-primary transition-colors text-center leading-tight whitespace-pre-line">
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
