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
    <section className="py-3 sm:py-4" style={{ minHeight: "280px" }}>
      <div className="flex gap-4 px-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0" style={{ width: "120px" }}>
            <div className="w-full aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  const mobileCategories = categories.slice(0, 8);
  const half = Math.ceil(mobileCategories.length / 2);
  const row1 = mobileCategories.slice(0, half);
  const row2 = mobileCategories.slice(half);
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
      <Link to={banner.link} className="block px-4">{content}</Link>
    ) : (
      <div className="px-4">{content}</div>
    );
  };

  const CategoryItem = ({ cat, idx, size = "mobile" }: { cat: typeof categories[0]; idx: number; size?: "mobile" | "desktop" | "tablet" }) => {
    const isDesktop = size === "desktop";
    const isMobile = size === "mobile";
    const isTablet = size === "tablet";
    const itemWidth = isMobile
      ? { width: "80px" }
      : isTablet
        ? { width: "100px" }
        : { width: "100%" };

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
        className={`flex flex-col items-center group shrink-0 snap-start ${isDesktop ? "gap-2.5" : "gap-1.5"}`}
        style={itemWidth}
      >
        <div
          className={`w-full aspect-square overflow-hidden bg-muted/25 ${imageShellClass} ${
            isDesktop
              ? "group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-200"
              : "transition-all duration-200"
          }`}
        >
          <div className="flex h-full w-full items-center justify-center p-2">
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
      {/* Mobile: 2 horizontal scroll rows with banner between */}
      <div className="sm:hidden space-y-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-0.5 snap-x snap-mandatory">
          {row1.map((cat, idx) => (
            <CategoryItem key={cat.id} cat={cat} idx={idx} />
          ))}
        </div>
        <BannerSlot />
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-0.5 snap-x snap-mandatory">
          {row2.map((cat, idx) => (
            <CategoryItem key={cat.id} cat={cat} idx={idx + half} />
          ))}
        </div>
      </div>

      {/* Tablet: single row scroll */}
      <div className="hidden sm:flex lg:hidden gap-4 overflow-x-auto scrollbar-hide px-6 pb-1 snap-x snap-mandatory">
        {mobileCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="tablet" />
        ))}
      </div>

      {/* Desktop: single row of 9 */}
      <div className="hidden lg:grid grid-cols-9 gap-x-4 gap-y-4 section-container">
        {desktopCategories.map((cat, idx) => (
          <CategoryItem key={cat.id} cat={cat} idx={idx} size="desktop" />
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
