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
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-4 sm:mb-5 md:mb-6">
        For Every Relationship
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {items.map((item: any) => (
          <Link
            key={item.id}
            to={item.link || `/product-category/${item.slug}`}
            className="flex flex-col items-center gap-2 group snap-start min-w-[80px] sm:min-w-[100px] md:min-w-[110px] lg:min-w-[120px]"
          >
            <div className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-card border border-border/40 group-hover:border-border/60 group-hover:shadow-[0_6px_20px_-6px_hsl(var(--foreground)/0.1)] transition-all duration-300 ease-out group-hover:scale-[1.03]">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                width={144}
                height={144}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-cover object-center"
                sizes="(max-width: 480px) 22vw, (max-width: 768px) 15vw, 12vw"
              />
            </div>
            <span className="text-[11px] sm:text-xs md:text-[13px] font-medium text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1">
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
