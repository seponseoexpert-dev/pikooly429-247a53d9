import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PopularGifting = memo(() => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["popular-gifting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_gifting")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 lg:py-8">
        <div className="section-container">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[160px] sm:w-[200px]">
                <div className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 lg:py-8" aria-label="Popular in Gifting">
      <div className="section-container">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-4 italic">
          Popular In Gifting
        </h2>

        {/* Desktop: grid row */}
        <div className="hidden lg:grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)` }}>
          {items.slice(0, 5).map((item) => (
            <GiftCard key={item.id} item={item} />
          ))}
        </div>

        {/* Mobile/Tablet: horizontal scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
          {items.map((item) => (
            <div key={item.id} className="shrink-0 snap-start" style={{ width: "calc(40vw - 12px)", minWidth: "140px", maxWidth: "200px" }}>
              <GiftCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

interface GiftItem {
  id: string;
  title: string;
  image_url: string | null;
  link: string | null;
}

const GiftCard = ({ item }: { item: GiftItem }) => {
  const content = (
    <div className="flex flex-col items-center group">
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#f5f0e8]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        )}
      </div>
      <span className="mt-2 text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center line-clamp-1">
        {item.title}
      </span>
    </div>
  );

  if (item.link) {
    return <Link to={item.link} className="block">{content}</Link>;
  }
  return content;
};

PopularGifting.displayName = "PopularGifting";
export default PopularGifting;
