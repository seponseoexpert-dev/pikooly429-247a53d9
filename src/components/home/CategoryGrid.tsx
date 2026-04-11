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

  // Fetch a single active banner to show between category rows
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
    <section className="py-4 sm:py-5 md:py-6 lg:py-8 section-container" style={{ minHeight: "280px" }}>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-full aspect-square rounded-xl bg-muted animate-pulse" />
            <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  // Mobile: first 8 categories in 2 rows of 4
  const mobileCategories = categories.slice(0, 8);
  const mobileRow1 = mobileCategories.slice(0, 4);
  const mobileRow2 = mobileCategories.slice(4, 8);

  // Desktop: first 9 categories in single row
  const desktopCategories = categories.slice(0, 9);

  const CategoryCard = ({ cat, idx, size = "mobile" }: { cat: typeof categories[0]; idx: number; size?: "mobile" | "desktop" }) => (
    <Link
      to={`/product-category/${cat.slug}`}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div className={`
        w-full aspect-square rounded-xl overflow-hidden bg-card
        shadow-[0_2px_10px_-2px_rgba(0,0,0,0.10)]
        group-hover:shadow-[0_4px_16px_-3px_rgba(0,0,0,0.16)]
        transition-all duration-300
        ${size === "desktop" ? "group-hover:scale-[1.03] p-3" : "p-2"}
      `}>
        <img
          src={cat.image_url || "/placeholder.svg"}
          alt={cat.name}
          width={size === "desktop" ? 120 : 96}
          height={size === "desktop" ? 120 : 96}
          decoding="async"
          className="w-full h-full object-contain"
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span className={`
        font-medium text-foreground/80 group-hover:text-foreground
        transition-colors text-center leading-tight line-clamp-2 w-full px-0.5
        ${size === "desktop" ? "text-xs" : "text-[10px] sm:text-[11px]"}
      `}>
        {cat.name}
      </span>
    </Link>
  );

  const BannerSlot = () => {
    if (!banner) return null;
    const bannerImage = banner.bg_image_url || banner.image_url;
    if (!bannerImage) return null;

    const content = (
      <div className="w-full rounded-xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(0,0,0,0.10)]">
        <img
          src={bannerImage}
          alt={banner.title || "Offer"}
          className="w-full h-auto object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );

    return banner.link ? (
      <Link to={banner.link} className="block">{content}</Link>
    ) : (
      <div>{content}</div>
    );
  };

  return (
    <section className="py-4 sm:py-5 md:py-6 lg:py-8 section-container" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "200px" }}>
      {/* Mobile/Tablet: 2 rows of 4 with banner in between */}
      <div className="lg:hidden space-y-3">
        {/* Row 1 - 4 categories */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {mobileRow1.map((cat, idx) => (
            <CategoryCard key={cat.id} cat={cat} idx={idx} size="mobile" />
          ))}
        </div>

        {/* Banner between rows */}
        <BannerSlot />

        {/* Row 2 - 4 categories */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {mobileRow2.map((cat, idx) => (
            <CategoryCard key={cat.id} cat={cat} idx={idx + 4} size="mobile" />
          ))}
        </div>
      </div>

      {/* Desktop: single row of 9 */}
      <div className="hidden lg:grid grid-cols-9 gap-x-4 gap-y-4 xl:gap-x-5">
        {desktopCategories.map((cat, idx) => (
          <CategoryCard key={cat.id} cat={cat} idx={idx} size="desktop" />
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
