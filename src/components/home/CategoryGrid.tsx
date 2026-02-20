import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CategoryGrid = () => {

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .filter("show_in_homepage", "eq", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Shop by Category">
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6">
        Shop by Category
      </h2>
      <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex-shrink-0"
          >
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 aspect-square rounded-2xl overflow-hidden bg-secondary border border-border/30 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-300">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
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
