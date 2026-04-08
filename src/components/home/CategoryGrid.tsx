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
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[calc(25%-9px)] gap-3 sm:gap-4 w-max min-w-full lg:grid-rows-1 lg:auto-cols-[calc(12.5%-10.5px)]">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/product-category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 group snap-start"
            >
              <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-[90px] md:h-[90px] lg:w-24 lg:h-24 rounded-2xl overflow-hidden bg-muted/30 border border-border/50 shadow-[0_1px_4px_0_hsl(var(--foreground)/0.06)] group-hover:border-primary/40 group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.25)] group-active:border-primary/60 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06] group-active:scale-[0.97]">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={96}
                  height={96}
                  decoding="async"
                  className="w-full h-full object-contain object-center p-1.5"
                  loading={idx < 8 ? "eager" : "lazy"}
                  fetchPriority={idx < 4 ? "high" : undefined}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2 max-w-[76px] sm:max-w-[84px] md:max-w-[92px]">
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
