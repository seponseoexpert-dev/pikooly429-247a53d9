import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CategoryGridSkeleton } from "@/components/ui/skeletons";

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

  if (isLoading) return <CategoryGridSkeleton />;

  if (categories.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Shop by Category">
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6 text-center">
        Shop by Category
      </h2>
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:flex md:justify-center md:gap-5 lg:gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="flex-shrink-0">
            <Link
              to={`/shop?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square md:w-24 md:h-24 lg:w-24 lg:h-24 rounded-2xl overflow-hidden bg-secondary border border-border/30 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-200">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={96}
                  height={96}
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
