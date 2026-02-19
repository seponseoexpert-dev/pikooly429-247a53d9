import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CategoryGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

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

  if (categories.length === 0) return null;

  return (
    <section ref={ref} className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Shop by Category">
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:flex md:gap-5 lg:gap-6 md:justify-center md:flex-wrap">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex justify-center"
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group w-20 sm:w-24 md:w-28 lg:w-32"
            >
              <div className="relative">
                <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden bg-[hsl(38,40%,93%)] border border-border/20 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-300">
                  <img
                    src={cat.image_url || "/placeholder.svg"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <span className="text-[11px] sm:text-xs md:text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
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
