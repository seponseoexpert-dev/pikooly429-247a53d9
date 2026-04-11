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
    <section className="py-2 sm:py-3" style={{ minHeight: "320px" }}>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 px-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-full aspect-square rounded-xl bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );

  if (categories.length === 0) return null;

  const half = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, half);
  const row2 = categories.slice(half);
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
      <Link to={banner.link} className="block px-3 sm:px-4">{content}</Link>
    ) : (
      <div className="px-3 sm:px-4">{content}</div>
    );
  };

  const MobileCategoryItem = ({ cat, idx }: { cat: typeof categories[0]; idx: number }) => (
    <Link
      to={`/product-category/${cat.slug}`}
      className="flex flex-col items-center gap-1.5 group snap-start shrink-0"
      style={{ width: "calc(25vw - 10px)", minWidth: "72px", maxWidth: "100px" }}
    >
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-black/[0.06] group-hover:border-primary/20 transition-colors p-1">
        <img
          src={cat.image_url || "/placeholder.svg"}
          alt={cat.name}
          width={96}
          height={96}
          decoding="async"
          className="w-full h-full object-contain rounded-lg"
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span className="text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2 w-full">
        {cat.name}
      </span>
    </Link>
  );

  const DesktopCategoryItem = ({ cat, idx }: { cat: typeof categories[0]; idx: number }) => (
    <Link
      to={`/product-category/${cat.slug}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-black/[0.06] group-hover:border-primary/20 group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-200 p-2.5">
        <img
          src={cat.image_url || "/placeholder.svg"}
          alt={cat.name}
          width={120}
          height={120}
          decoding="async"
          className="w-full h-full object-contain"
          loading={idx < 4 ? "eager" : "lazy"}
          fetchPriority={idx < 2 ? "high" : undefined}
        />
      </div>
      <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2 w-full">
        {cat.name}
      </span>
    </Link>
  );

  return (
    <section className="py-2 sm:py-3 md:py-5 lg:py-8" aria-label="Shop by Category" style={{ contain: "layout style", minHeight: "200px" }}>
      {/* Mobile/Tablet: 2 horizontal scroll rows with banner between */}
      <div className="lg:hidden space-y-2.5">
        {/* Row 1 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 sm:px-4 pb-0.5 snap-x snap-mandatory">
          {row1.map((cat, idx) => (
            <MobileCategoryItem key={cat.id} cat={cat} idx={idx} />
          ))}
        </div>

        <BannerSlot />

        {/* Row 2 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 sm:px-4 pb-0.5 snap-x snap-mandatory">
          {row2.map((cat, idx) => (
            <MobileCategoryItem key={cat.id} cat={cat} idx={idx + half} />
          ))}
        </div>
      </div>

      {/* Desktop: single row grid of 9 */}
      <div className="hidden lg:grid grid-cols-9 gap-x-4 gap-y-4 xl:gap-x-5 section-container">
        {desktopCategories.map((cat, idx) => (
          <DesktopCategoryItem key={cat.id} cat={cat} idx={idx} />
        ))}
      </div>
    </section>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
