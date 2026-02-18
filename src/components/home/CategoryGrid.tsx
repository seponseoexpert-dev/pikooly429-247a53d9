import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const CategoryGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 md:py-16 section-container" aria-label="Shop by Category">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Shop by Category
        </h2>
        <div className="flex items-center justify-center gap-3 text-primary/40 mt-3">
          <span className="h-px w-12 bg-primary/30" />
          <span className="text-xl">✿</span>
          <span className="h-px w-12 bg-primary/30" />
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-5">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-muted border-2 border-transparent group-hover:border-primary transition-all duration-300 group-hover:shadow-md">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors text-center">
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