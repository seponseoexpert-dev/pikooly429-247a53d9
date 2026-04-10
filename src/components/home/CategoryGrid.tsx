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
    <section className="py-4 sm:py-5 md:py-6 lg:py-8 section-container" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "200px" }}>
      {/* Mobile/Tablet: 2-row horizontal scroll | Desktop: full grid */}
      <div className="lg:hidden">
        <div className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory auto-cols-[80px] sm:auto-cols-[90px] md:auto-cols-[100px]">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/product-category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 group snap-start"
            >
              <div className="w-[76px] h-[76px] sm:w-[86px] sm:h-[86px] md:w-[96px] md:h-[96px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 p-1.5 sm:p-2">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={96}
                  height={96}
                  decoding="async"
                  className="w-full h-full object-contain"
                  loading={idx < 4 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : undefined}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-[76px] sm:w-[86px] md:w-[96px]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: full-width grid */}
      <div className="hidden lg:grid grid-cols-8 gap-x-5 gap-y-5 justify-items-center">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-2 group w-full"
          >
            <div className="w-[100px] h-[100px] xl:w-[110px] xl:h-[110px] mx-auto rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 group-hover:scale-[1.03] p-2.5">
              <img
                src={cat.image_url || "/placeholder.svg"}
                alt={cat.name}
                width={110}
                height={110}
                decoding="async"
                className="w-full h-full object-contain"
                  loading={idx < 4 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : undefined}
              />
            </div>
            <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-full px-0.5">
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
