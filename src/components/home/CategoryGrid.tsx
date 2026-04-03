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
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-8 md:gap-5 lg:gap-6 max-w-6xl mx-auto">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-muted/40 ring-1 ring-border/30 group-hover:ring-primary/30 group-hover:shadow-lg transition-all duration-300 group-hover:scale-[1.04] group-active:scale-95">
              <img
                src={cat.image_url || "/placeholder.svg"}
                alt={cat.name}
                width={144}
                height={144}
                decoding="async"
                className="w-full h-full object-cover object-center"
                loading={idx < 8 ? "eager" : "lazy"}
                fetchPriority={idx < 4 ? "high" : undefined}
                sizes="(max-width: 480px) 20vw, (max-width: 768px) 22vw, 12vw"
              />
            </div>
            <span className="text-[10px] sm:text-xs md:text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2">
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
