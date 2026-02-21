import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


const CategoryGrid = memo(() => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .eq("show_in_homepage", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container flex items-center justify-center min-h-[120px]">
      <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </section>
  );

  if (categories.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container animate-fade-in" aria-label="Shop by Category">
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6 text-center">
        Shop by Category
      </h2>
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-4xl mx-auto">
        {categories.map((cat) => (
          <div key={cat.id}>
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-2xl overflow-hidden bg-secondary border border-border/30 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={144}
                  height={144}
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
