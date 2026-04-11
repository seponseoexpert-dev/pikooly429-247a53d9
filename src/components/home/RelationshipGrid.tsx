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
    <section className="py-4 sm:py-5 md:py-6 lg:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-4 sm:mb-5">
        For Every Relationship
      </h2>

      {/* Single-row horizontal scroll on mobile/tablet */}
      <div className="lg:hidden -mx-4 px-4">
        <div className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {items.map((item: any) => (
            <Link
              key={item.id}
              to={item.link || `/product-category/${item.slug}`}
              className="flex flex-col items-center gap-2 group snap-start shrink-0"
            >
              <div className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden bg-card shadow-[0_2px_12px_-3px_rgba(0,0,0,0.12)] group-hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)] transition-all duration-300">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  width={100}
                  height={100}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-[80px] sm:w-[90px] md:w-[100px]">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: single-row scroll */}
      <div className="hidden lg:flex gap-6 xl:gap-8 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {items.map((item: any) => (
          <Link
            key={item.id}
            to={item.link || `/product-category/${item.slug}`}
            className="flex flex-col items-center gap-2 group snap-start shrink-0"
          >
            <div className="w-[110px] h-[110px] xl:w-[120px] xl:h-[120px] rounded-xl overflow-hidden bg-card shadow-[0_2px_12px_-3px_rgba(0,0,0,0.12)] group-hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:scale-[1.03]">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                width={120}
                height={120}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[110px] xl:max-w-[120px]">
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
