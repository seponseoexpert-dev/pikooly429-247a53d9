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
      <div className="mb-4 sm:mb-6">
        <h2 className="font-bold text-foreground text-left" style={{ fontSize: "clamp(1.25rem, 2.5vw + 0.5rem, 2rem)" }}>
          For Every Relationship
        </h2>
      </div>

      {/* Horizontal scroll on all sizes */}
      <div className="-mx-4 px-4">
        <div className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {items.map((item: any) => (
            <Link
              key={item.id}
              to={item.link || `/product-category/${item.slug}`}
              className="flex flex-col gap-2 group snap-start shrink-0"
            >
              <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] rounded-2xl overflow-hidden bg-muted/40 transition-all duration-500 group-hover:shadow-md">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  width={200}
                  height={200}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                />
              </div>
              <span className="text-sm sm:text-base font-medium text-foreground/90 group-hover:text-primary transition-colors duration-300 text-left leading-tight line-clamp-1 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

RelationshipGrid.displayName = "RelationshipGrid";
export default RelationshipGrid;
