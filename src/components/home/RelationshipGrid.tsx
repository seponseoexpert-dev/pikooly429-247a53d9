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
    <section className="py-3 sm:py-5 md:py-6 lg:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-3 sm:mb-4 md:mb-5">
        For Every Relationship
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {items.map((item: any) => (
          <Link
            key={item.id}
            to={item.link || `/product-category/${item.slug}`}
            className="flex flex-col items-center gap-1.5 group snap-start shrink-0"
          >
            <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] md:w-[90px] md:h-[90px] lg:w-[100px] lg:h-[100px] rounded-full overflow-hidden bg-card border border-border/40 group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-out group-hover:scale-[1.05]">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                width={100}
                height={100}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-cover object-center"
                sizes="(max-width: 480px) 72px, (max-width: 768px) 80px, 100px"
              />
            </div>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 max-w-[72px] sm:max-w-[80px] md:max-w-[90px] lg:max-w-[100px]">
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
