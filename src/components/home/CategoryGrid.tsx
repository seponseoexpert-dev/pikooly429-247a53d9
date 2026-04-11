import { memo, useRef } from "react";
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
    <section className="py-3 sm:py-4 lg:py-6" style={{ minHeight: "200px" }}>
      {/* Mobile/Tablet: horizontal scroll skeleton */}
      <div className="flex gap-4 px-4 overflow-hidden lg:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0" style={{ width: "100px" }}>
            <div className="w-[100px] h-[100px] rounded-2xl bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      {/* Desktop: grid skeleton */}
      <div className="hidden lg:grid grid-cols-9 gap-x-5 gap-y-4 section-container">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5">
            <div className="w-full aspect-square rounded-[20px] bg-muted animate-pulse" />
            <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  const row1 = categories.slice(0, Math.ceil(categories.length / 2));
  const row2 = categories.slice(Math.ceil(categories.length / 2));
  const desktopCategories = categories.slice(0, 9);

  return (
    <section className="py-3 sm:py-4 lg:py-6" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "180px" }}>
      {/* Mobile & Tablet: Two rows, horizontal scroll like FNP */}
      <div className="lg:hidden space-y-5">
        <ScrollRow categories={row1} startIdx={0} />
        <ScrollRow categories={row2} startIdx={row1.length} />
      </div>

      {/* Desktop: 9-column grid */}
      <div className="hidden lg:grid grid-cols-9 gap-x-5 gap-y-4 section-container">
        {desktopCategories.map((cat, idx) => (
          <Link
            key={cat.id}
            to={`/product-category/${cat.slug}`}
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className="w-full aspect-square overflow-hidden rounded-[20px] bg-[#f5f5f5] group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-200">
              <div className="flex h-full w-full items-center justify-center p-3">
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  width={140}
                  height={140}
                  decoding="async"
                  className="max-h-[80%] max-w-[80%] h-auto w-auto object-contain"
                  loading={idx < 4 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : undefined}
                />
              </div>
            </div>
            <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2 w-full">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});

/** Horizontal scroll row for mobile/tablet — FNP style large icons */
const ScrollRow = ({ categories, startIdx }: { categories: { id: string; name: string; slug: string; image_url: string | null }[]; startIdx: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 sm:gap-4 px-4 sm:px-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {categories.map((cat, idx) => (
        <Link
          key={cat.id}
          to={`/product-category/${cat.slug}`}
          className="flex flex-col items-center gap-1.5 shrink-0 snap-start group"
          style={{ width: "90px" }}
        >
          <div className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] overflow-hidden rounded-2xl bg-[#f5f5f5]">
            <div className="flex h-full w-full items-center justify-center p-2">
              <img
                src={cat.image_url || "/placeholder.svg"}
                alt={cat.name}
                width={80}
                height={80}
                decoding="async"
                className="max-h-[78%] max-w-[78%] h-auto w-auto object-contain"
                loading={startIdx + idx < 4 ? "eager" : "lazy"}
                fetchPriority={startIdx + idx < 2 ? "high" : undefined}
              />
            </div>
          </div>
          <span className="text-[11px] sm:text-[12px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 w-full">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
};

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
