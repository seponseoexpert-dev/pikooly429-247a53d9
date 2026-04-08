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
    <section className="py-4 sm:py-5 md:py-6 lg:py-8 section-container" aria-label="Shop by Category" style={{ contain: "layout style" }}>
      <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-2 group snap-start shrink-0"
          >
            <div className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] md:w-[110px] md:h-[110px] lg:w-[120px] lg:h-[120px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 ease-out group-hover:scale-[1.03] p-2 sm:p-2.5">
              <img
                src={cat.image_url || "/placeholder.svg"}
                alt={cat.name}
                width={120}
                height={120}
                decoding="async"
                className="w-full h-full object-contain"
                loading={idx < 8 ? "eager" : "lazy"}
                fetchPriority={idx < 4 ? "high" : undefined}
              />
            </div>
            <span className="text-[11px] sm:text-xs md:text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[90px] sm:max-w-[100px] md:max-w-[110px] lg:max-w-[120px]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
