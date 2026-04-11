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
    <section className="py-3 sm:py-4 md:py-5 lg:py-6" style={{ minHeight: "220px" }}>
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-4 sm:hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-full aspect-square rounded-[16px] bg-muted animate-pulse" />
            <div className="h-3 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="hidden sm:grid lg:hidden grid-cols-4 gap-x-4 gap-y-4 px-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[110px] aspect-square rounded-[18px] bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="hidden lg:grid grid-cols-9 gap-x-4 xl:gap-x-5 gap-y-4 section-container">
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

  const mobileCategories = categories.slice(0, 8);
  const tabletCategories = categories.slice(0, 8);
  const desktopCategories = categories.slice(0, 9);

  const CategoryItem = ({ cat, idx, size = "mobile" }: { cat: typeof categories[0]; idx: number; size?: "mobile" | "desktop" | "tablet" }) => {
    const isDesktop = size === "desktop";
    const isTablet = size === "tablet";
    const itemWidth = isDesktop
      ? { width: "100%" }
      : isTablet
        ? { width: "100%", maxWidth: "110px" }
        : { width: "100%", maxWidth: "86px" };

    const imageShellClass = isDesktop
      ? "rounded-[20px]"
      : isTablet
        ? "rounded-[18px]"
        : "rounded-[16px] sm:rounded-[18px]";

    const imageScaleClass = isDesktop
      ? "h-[76%] w-[76%]"
      : isTablet
        ? "h-[74%] w-[74%]"
        : "h-[72%] w-[72%]";

    return (
      <Link
        to={`/product-category/${cat.slug}`}
        className={`flex w-full flex-col items-center justify-self-center group ${isDesktop ? "gap-2.5" : "gap-1.5"}`}
        style={itemWidth}
      >
        <div
          className={`w-full aspect-square overflow-hidden bg-muted/25 ${imageShellClass} ${
            isDesktop
              ? "group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-200"
              : "transition-all duration-200"
          }`}
        >
          <div className="flex h-full w-full items-center justify-center p-1.5 sm:p-2">
            <img
              src={cat.image_url || "/placeholder.svg"}
              alt={cat.name}
              width={isDesktop ? 140 : 100}
              height={isDesktop ? 140 : 100}
              decoding="async"
              className={`${imageScaleClass} object-contain`}
              loading={idx < 4 ? "eager" : "lazy"}
              fetchPriority={idx < 2 ? "high" : undefined}
            />
          </div>
        </div>
        <span
          className={`font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2 w-full ${
            isDesktop ? "text-[13px]" : "text-[11px] sm:text-[12px]"
          }`}
        >
          {cat.name}
        </span>
      </Link>
    );
  };

  return (
    <section className="py-3 sm:py-4 md:py-5 lg:py-6" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-4 sm:hidden">
        {mobileCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} />
        ))}
      </div>

      <div className="hidden sm:grid lg:hidden grid-cols-4 gap-x-4 gap-y-4 px-6">
        {tabletCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="tablet" />
        ))}
      </div>

      <div className="hidden lg:grid grid-cols-9 gap-x-4 xl:gap-x-5 gap-y-4 section-container">
        {desktopCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="desktop" />
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
