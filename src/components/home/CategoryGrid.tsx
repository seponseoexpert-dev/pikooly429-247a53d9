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
      <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:flex-wrap md:justify-center md:overflow-visible">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-2 group flex-shrink-0 snap-start w-[72px] sm:w-[80px] md:w-[90px]"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-2xl overflow-hidden bg-muted/40 ring-1 ring-border/30 group-hover:ring-primary/40 group-hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.2)] transition-all duration-300 group-hover:scale-[1.06] group-active:scale-95">
              <img
                src={cat.image_url || "/placeholder.svg"}
                alt={cat.name}
                width={72}
                height={72}
                decoding="async"
                className="w-full h-full object-cover object-center"
                loading={idx < 8 ? "eager" : "lazy"}
                fetchPriority={idx < 4 ? "high" : undefined}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2">
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
