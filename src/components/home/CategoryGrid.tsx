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
    <section className="py-4 sm:py-6 md:py-8 section-container flex items-center justify-center min-h-[120px]">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </section>
  );

  if (categories.length === 0) return null;

  return (
    <section className="py-3 sm:py-5 md:py-6 lg:py-8 section-container" aria-label="Shop by Category" style={{ contain: "layout style" }}>
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-max min-w-full px-0.5 py-1">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/product-category/${cat.slug}`}
              className="flex flex-col items-center gap-2 sm:gap-2.5 group snap-start shrink-0"
            >
              <div className="w-[90px] h-[90px] sm:w-[105px] sm:h-[105px] md:w-[115px] md:h-[115px] lg:w-[130px] lg:h-[130px] rounded-2xl overflow-hidden bg-card border border-border/60 group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-out group-hover:scale-[1.03] group-active:scale-[0.97]">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={130}
                  height={130}
                  decoding="async"
                  className="w-full h-full object-contain object-center p-2.5 sm:p-3"
                  loading={idx < 8 ? "eager" : "lazy"}
                  fetchPriority={idx < 4 ? "high" : undefined}
                />
              </div>
              <span className="text-[11px] sm:text-xs md:text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[90px] sm:max-w-[105px] md:max-w-[115px] lg:max-w-[130px]">
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
