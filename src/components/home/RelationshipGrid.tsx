import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const RelationshipGrid = memo(() => {
  const { data: items = [] } = useQuery({
    queryKey: ["relationship-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relationship_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (items.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 section-container" style={{ contain: "layout style" }}>
      <div className="text-center mb-6 sm:mb-8">
        <span className="gold-rule mb-2.5">For Every Bond</span>
        <h2 className="display-heading text-foreground" style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}>
          For Every Relationship
        </h2>
      </div>

      {/* Single-row horizontal scroll on mobile/tablet */}
      <div className="lg:hidden -mx-4 px-4">
        <div className="flex flex-nowrap gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory">
          {items.map((item: any) => (
            <Link
              key={item.id}
              to={item.link || `/product-category/${item.slug}`}
              className="flex flex-col items-center gap-2.5 group snap-start shrink-0"
            >
              <div className="relative w-[84px] h-[84px] sm:w-[94px] sm:h-[94px] md:w-[104px] md:h-[104px] rounded-full overflow-hidden bg-card border border-[hsl(var(--gold)/0.25)] shadow-soft group-hover:shadow-luxe group-hover:border-[hsl(var(--gold)/0.6)] transition-all duration-700 ease-luxe">
                <span aria-hidden className="absolute inset-0 ring-1 ring-inset ring-[hsl(var(--gold)/0.15)] rounded-full pointer-events-none z-10" />
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  width={104}
                  height={104}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-foreground/85 group-hover:text-primary transition-colors duration-500 text-center leading-tight line-clamp-1 w-[84px] sm:w-[94px] md:w-[104px]">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: single-row scroll */}
      <div className="hidden lg:flex justify-center gap-7 xl:gap-9 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory">
        {items.map((item: any) => (
          <Link
            key={item.id}
            to={item.link || `/product-category/${item.slug}`}
            className="flex flex-col items-center gap-2.5 group snap-start shrink-0"
          >
            <div className="relative w-[114px] h-[114px] xl:w-[124px] xl:h-[124px] rounded-full overflow-hidden bg-card border border-[hsl(var(--gold)/0.25)] shadow-soft group-hover:shadow-luxe group-hover:border-[hsl(var(--gold)/0.6)] transition-all duration-700 ease-luxe group-hover:-translate-y-1">
              <span aria-hidden className="absolute inset-0 ring-1 ring-inset ring-[hsl(var(--gold)/0.15)] rounded-full pointer-events-none z-10" />
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                width={124}
                height={124}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-110"
              />
            </div>
            <span className="text-[13px] font-semibold text-foreground/85 group-hover:text-primary transition-colors duration-500 text-center leading-tight line-clamp-1 max-w-[114px] xl:max-w-[124px]">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});

RelationshipGrid.displayName = "RelationshipGrid";
export default RelationshipGrid;
