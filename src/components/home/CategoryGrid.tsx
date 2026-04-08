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
        .neq("category_type", "tailored")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  if (isLoading) return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 section-container flex items-center justify-center min-h-[120px]">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </section>
  );

  if (categories.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-14 section-container" aria-label="Shop by Category" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-4 sm:mb-6 md:mb-8 text-center">
        Shop by Category
      </h2>
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
        <div className="flex gap-4 sm:gap-5 md:gap-6 w-max min-w-full justify-center">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/product-category/${cat.slug}`}
              className="flex flex-col items-center gap-2 group snap-start shrink-0"
            >
              <div className="w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] md:w-[120px] md:h-[120px] lg:w-[130px] lg:h-[130px] rounded-2xl overflow-hidden bg-[hsl(var(--muted)/0.3)] border border-border/40 shadow-[0_1px_6px_0_hsl(var(--foreground)/0.06)] group-hover:border-primary/40 group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.2)] transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.05] group-active:scale-[0.97]">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={130}
                  height={130}
                  decoding="async"
                  className="w-full h-full object-contain object-center p-2"
                  loading={idx < 8 ? "eager" : "lazy"}
                  fetchPriority={idx < 4 ? "high" : undefined}
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
