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
    <section className="py-3 sm:py-4 md:py-6 section-container flex items-center justify-center min-h-[120px]">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </section>
  );

  if (categories.length === 0) return null;

  return (
    <section className="py-2 sm:py-3 md:py-5 lg:py-6 section-container" aria-label="Shop by Category" style={{ contain: "layout style" }}>
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {/* 2-row grid: mobile 4 cols, tablet 5 cols, desktop 8 cols */}
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[72px] sm:auto-cols-[80px] md:auto-cols-[90px] lg:auto-cols-[100px] xl:auto-cols-[110px] gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 md:gap-x-5 md:gap-y-4 w-max min-w-full px-0.5 py-1">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/product-category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 group snap-start"
            >
              <div className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] lg:w-[88px] lg:h-[88px] xl:w-[96px] xl:h-[96px] rounded-full overflow-hidden bg-card border border-border/50 group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-out group-hover:scale-[1.05] group-active:scale-[0.97]">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={96}
                  height={96}
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                  loading={idx < 8 ? "eager" : "lazy"}
                  fetchPriority={idx < 4 ? "high" : undefined}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[64px] sm:max-w-[72px] md:max-w-[80px] lg:max-w-[88px] xl:max-w-[96px]">
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
