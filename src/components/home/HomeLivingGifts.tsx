import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home } from "lucide-react";

const HomeLivingGifts = memo(() => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["home-living-gifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_living_gifts")
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
          <div className="h-7 w-56 bg-muted animate-pulse rounded mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded mt-3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 lg:py-8" aria-label="Home & Living Gifts">
      <div className="section-container">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-4 italic">
          Home & Living Gifts
        </h2>

        {/* 3-col grid on all screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {items.map((item: any) => (
            <GiftCard key={item.id} item={item} />
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
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted/50">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-10 h-10 text-foreground/30" />
          </div>
        )}
      </div>
      <span className="mt-2.5 text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors text-center line-clamp-1">
        {item.title}
      </span>
    </div>
  );

  if (item.link) {
    return <Link to={item.link} className="block">{content}</Link>;
  }
  return content;
};

HomeLivingGifts.displayName = "HomeLivingGifts";
export default HomeLivingGifts;
