import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

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

  const compactCategories = categories.slice(0, 8);
  const tabletCategories = categories.slice(0, 8);
  const desktopCategories = categories.slice(0, 9);

  return (
    <section className="py-3 sm:py-4 lg:py-6" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 px-3 sm:px-6 md:hidden">
        {compactCategories.map((cat, idx) => (
          <div key={cat.id} className="flex justify-center">
            <CategoryItem cat={cat} idx={idx} size="compact" />
          </div>
        ))}
      </div>

      <div className="hidden md:grid xl:hidden grid-cols-8 gap-x-4 gap-y-4 section-container">
        {tabletCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="desktop" />
        ))}
      </div>

      <div className="hidden xl:grid grid-cols-9 gap-x-5 gap-y-4 section-container">
        {desktopCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="desktop" />
        ))}
      </div>
    </section>
  );
});

const CategoryItem = ({ cat, idx, size }: { cat: Category; idx: number; size: "compact" | "desktop" }) => {
  return (
    <Link
      to={`/product-category/${cat.slug}`}
      className={`group flex w-full flex-col items-center ${
        size === "compact" ? "max-w-[82px] gap-2 sm:max-w-[104px]" : "gap-2.5"
      }`}
    >
      <div
        className={`flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/70 transition-all duration-200 ${
          size === "compact"
            ? "rounded-[18px] p-2 shadow-sm"
            : "rounded-[20px] p-2.5 group-hover:scale-[1.03] group-hover:shadow-md lg:p-3"
        }`}
      >
        <img
          src={cat.image_url || "/placeholder.svg"}
          alt={cat.name}
          width={size === "compact" ? 84 : 140}
          height={size === "compact" ? 84 : 140}
          decoding="async"
          className={`h-auto w-auto object-contain transition-transform duration-200 group-hover:scale-[1.04] ${
            size === "compact" ? "max-h-[86%] max-w-[86%]" : "max-h-[88%] max-w-[88%]"
          }`}
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span
        className={`w-full text-center font-medium leading-tight line-clamp-2 text-foreground/80 transition-colors group-hover:text-foreground ${
          size === "compact" ? "text-[11px] sm:text-xs" : "text-[13px]"
        }`}
      >
        {cat.name}
      </span>
    </Link>
  );
};

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
