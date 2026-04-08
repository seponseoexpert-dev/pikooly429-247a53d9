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
    <section className="py-3 sm:py-4 md:py-6 lg:py-8 section-container" aria-label="Shop by Category" style={{ contain: "layout style" }}>
      {/* Mobile: 4 cols, Tablet: 5 cols, Desktop: 8 cols — always fills full width */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 md:gap-x-4 md:gap-y-6 lg:gap-x-5 lg:gap-y-6 justify-items-center">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-1.5 sm:gap-2 group w-full"
          >
            <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 lg:w-[90px] lg:h-[90px] xl:w-24 xl:h-24 mx-auto rounded-full overflow-hidden bg-card border border-border/50 group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-out group-hover:scale-[1.05] group-active:scale-[0.97]">
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
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-full px-0.5">
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
