import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOptimizedCloudinaryUrl } from "@/lib/imageUtils";

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
    <section className="py-3 sm:py-4 lg:py-6" style={{ minHeight: "220px" }}>
      <div className="grid grid-cols-4 gap-3 px-4 md:hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-full aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="h-3 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="hidden md:flex justify-center gap-5 section-container lg:hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 flex-1 max-w-[120px]">
            <div className="w-full aspect-square rounded-[20px] bg-muted animate-pulse" />
            <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="hidden lg:flex justify-center gap-5 section-container">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 flex-1 max-w-[130px]">
            <div className="w-full aspect-square rounded-[20px] bg-muted animate-pulse" />
            <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  const mobileItems = categories.slice(0, 8);
  const tabletItems = categories.slice(0, 8);
  const desktopItems = categories.slice(0, 9);

  return (
    <section className="py-3 sm:py-4 lg:py-6" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "220px" }}>
      {/* Mobile: 2 rows × 4 columns */}
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-4 md:hidden">
        {mobileItems.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} variant="mobile" />
        ))}
      </div>

      {/* Tablet: single row */}
      <div className="hidden md:flex lg:hidden justify-center gap-4 section-container">
        {tabletItems.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} variant="tablet" />
        ))}
      </div>

      {/* Desktop: single row */}
      <div className="hidden lg:flex justify-center gap-5 section-container">
        {desktopItems.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} variant="desktop" />
        ))}
      </div>
    </section>
  );
});

const CategoryItem = ({ cat, idx, variant }: { cat: Category; idx: number; variant: "mobile" | "tablet" | "desktop" }) => {
  const containerClass = variant === "mobile"
    ? "flex flex-col items-center gap-1.5 w-full"
    : "flex flex-col items-center gap-2.5 flex-1 max-w-[130px]";

  const iconBoxClass = variant === "mobile"
    ? "w-full aspect-square rounded-[18px] bg-muted/70 flex items-center justify-center p-2 shadow-sm"
    : "w-full aspect-square rounded-[20px] bg-muted/70 flex items-center justify-center p-2.5 transition-all duration-200 hover:scale-[1.03] hover:shadow-md";

  const imgSize = variant === "mobile" ? 80 : 120;
  const cloudinaryWidth = variant === "mobile" ? 100 : 150;
  const imgMaxClass = variant === "mobile" ? "max-h-[85%] max-w-[85%]" : "max-h-[88%] max-w-[88%]";

  const textClass = variant === "mobile"
    ? "w-full text-center text-[11px] sm:text-xs font-medium leading-tight line-clamp-2 text-foreground/80"
    : "w-full text-center text-[13px] font-medium leading-tight line-clamp-2 text-foreground/80 transition-colors group-hover:text-foreground";

  return (
    <Link to={`/product-category/${cat.slug}`} className={`group ${containerClass}`}>
      <div className={iconBoxClass}>
        <img
          src={getOptimizedCloudinaryUrl(cat.image_url || "/placeholder.svg", cloudinaryWidth)}
          alt={cat.name}
          width={imgSize}
          height={imgSize}
          decoding="async"
          className={`h-auto w-auto object-contain transition-transform duration-200 group-hover:scale-[1.04] ${imgMaxClass}`}
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span className={textClass}>{cat.name}</span>
    </Link>
  );
};

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
