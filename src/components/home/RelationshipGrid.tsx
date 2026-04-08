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

      {/* Mobile/Tablet: 2-row horizontal scroll */}
      <div className="lg:hidden">
        <div className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory auto-cols-[80px] sm:auto-cols-[90px] md:auto-cols-[100px]">
          {items.map((item: any) => (
            <Link
              key={item.id}
              to={item.link || `/product-category/${item.slug}`}
              className="flex flex-col items-center gap-1.5 group snap-start"
            >
              <div className="w-[76px] h-[76px] sm:w-[86px] sm:h-[86px] md:w-[96px] md:h-[96px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 p-1.5 sm:p-2">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  width={96}
                  height={96}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-[76px] sm:w-[86px] md:w-[96px]">
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
            <div className="w-[110px] h-[110px] xl:w-[120px] xl:h-[120px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 group-hover:scale-[1.03] p-2.5">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                width={120}
                height={120}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[110px] xl:max-w-[120px]">
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
