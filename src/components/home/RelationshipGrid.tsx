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

      <div className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {items.map((item: any) => (
          <Link
            key={item.id}
            to={item.link || `/product-category/${item.slug}`}
            className="flex flex-col items-center gap-2 group snap-start shrink-0"
          >
            <div className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] md:w-[110px] md:h-[110px] lg:w-[120px] lg:h-[120px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300 ease-out group-hover:scale-[1.03] p-2 sm:p-2.5">
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
            <span className="text-[11px] sm:text-xs md:text-[13px] font-medium text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[80px] sm:max-w-[90px] md:max-w-[100px] lg:max-w-[110px]">
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
