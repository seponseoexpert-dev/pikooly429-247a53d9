import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const CategoryGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-8 md:py-14 section-container" aria-label="Shop by Category">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">
          Shop by Category
        </h2>
        <div className="flex items-center justify-center gap-3 text-primary/40 mt-2">
          <span className="h-px w-8 bg-primary/30" />
          <span className="text-base">✿</span>
          <span className="h-px w-8 bg-primary/30" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 md:grid-cols-8 md:gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-2xl overflow-hidden bg-secondary shadow-sm border border-border/30 group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] md:text-sm font-medium text-foreground/70 group-hover:text-primary transition-colors text-center leading-tight">
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