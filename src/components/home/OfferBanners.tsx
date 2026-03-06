import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

const OfferBanners = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["offer-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (banners.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6">
        Get Exclusive Offers from
      </h2>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {banners.map((b: any) => {
            const content = (
              <div
                key={b.id}
                className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] rounded-2xl p-5 sm:p-6 relative overflow-hidden flex-shrink-0 border border-border/30"
                style={{ backgroundColor: b.bg_color || "hsl(var(--secondary))" }}
              >
                {b.logo_url && (
                  <img src={b.logo_url} alt="" className="h-6 sm:h-7 mb-3 object-contain" loading="lazy" />
                )}
                {b.subtitle && (
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {b.subtitle}
                  </p>
                )}
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mt-1">
                  {b.title}
                </h3>
                {b.description && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">{b.description}</p>
                )}
              </div>
            );

            return b.link ? (
              <Link key={b.id} to={b.link} className="flex-shrink-0 hover:opacity-90 transition-opacity">
                {content}
              </Link>
            ) : (
              <div key={b.id} className="flex-shrink-0">{content}</div>
            );
          })}
        </div>

        {banners.length > 2 && (
          <>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-8 h-8 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-8 h-8 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
});

OfferBanners.displayName = "OfferBanners";
export default OfferBanners;
