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

  const { data: banner } = useQuery({
    queryKey: ["category-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_banners")
        .select("id, title, image_url, bg_image_url, link")
        .eq("is_active", true)
        .order("display_order")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <section className="py-3 sm:py-4 section-container" style={{ minHeight: "260px" }}>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: "22vw" }}>
            <div className="w-full aspect-square rounded-xl bg-muted animate-pulse" />
            <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  // Split categories into two rows for mobile scroll
  const half = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, half);
  const row2 = categories.slice(half);

  // Desktop: first 9
  const desktopCategories = categories.slice(0, 9);

  const bannerImage = banner?.bg_image_url || banner?.image_url;

  const BannerSlot = () => {
    if (!bannerImage) return null;
    const content = (
      <div className="rounded-xl overflow-hidden">
        <img
          src={bannerImage}
          alt={banner?.title || "Offer"}
          className="w-full h-auto object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
    return banner?.link ? (
      <Link to={banner.link} className="block mx-4 sm:mx-5">{content}</Link>
    ) : (
      <div className="mx-4 sm:mx-5">{content}</div>
    );
  };

  const CategoryItem = ({ cat, idx, isDesktop = false }: { cat: typeof categories[0]; idx: number; isDesktop?: boolean }) => (
    <Link
      to={`/product-category/${cat.slug}`}
      className={`flex flex-col items-center group ${isDesktop ? "gap-2" : "gap-1 shrink-0 snap-start"}`}
      style={isDesktop ? undefined : { width: "22vw", minWidth: "76px", maxWidth: "110px" }}
    >
      <div className={`
        w-full aspect-square rounded-xl overflow-hidden bg-white
        shadow-[0_1px_6px_-1px_rgba(0,0,0,0.08)]
        group-hover:shadow-[0_3px_12px_-2px_rgba(0,0,0,0.14)]
        transition-all duration-300
        ${isDesktop ? "group-hover:scale-[1.03] p-2.5" : "p-1.5 sm:p-2"}
      `}>
        <img
          src={cat.image_url || "/placeholder.svg"}
          alt={cat.name}
          width={isDesktop ? 120 : 96}
          height={isDesktop ? 120 : 96}
          decoding="async"
          className="w-full h-full object-contain"
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span className={`
        font-medium text-foreground/80 group-hover:text-foreground
        transition-colors text-center leading-tight line-clamp-2 w-full
        ${isDesktop ? "text-xs" : "text-[10px] sm:text-[11px]"}
      `}>
        {cat.name}
      </span>
    </Link>
  );

  return (
    <section className="py-3 sm:py-4 md:py-5 lg:py-8" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "200px" }}>
      {/* Mobile/Tablet: 2 horizontal scroll rows with banner between */}
      <div className="lg:hidden space-y-2.5">
        {/* Row 1 - horizontal scroll */}
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-5 pb-1 snap-x snap-mandatory">
          {row1.map((cat, idx) => (
            <CategoryItem key={cat.id} cat={cat} idx={idx} />
          ))}
        </div>

        {/* Banner between rows */}
        <BannerSlot />

        {/* Row 2 - horizontal scroll */}
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-5 pb-1 snap-x snap-mandatory">
          {row2.map((cat, idx) => (
            <CategoryItem key={cat.id} cat={cat} idx={idx + half} />
          ))}
        </div>
      </div>

      {/* Desktop: single row grid of 9 */}
      <div className="hidden lg:grid grid-cols-9 gap-x-4 gap-y-4 xl:gap-x-5 section-container">
        {desktopCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} isDesktop />
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
