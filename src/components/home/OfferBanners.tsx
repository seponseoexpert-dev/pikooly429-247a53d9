import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-3 sm:mb-4 md:mb-6">
        Get Exclusive Offers from
      </h2>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth-ios pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {banners.map((b: any) => {
            const bgColor = b.bg_color || "hsl(var(--secondary))";

            const card = (
              <div
                key={b.id}
                className="min-w-[260px] w-[75vw] max-w-[380px] sm:min-w-[300px] sm:w-auto md:min-w-[340px] lg:min-w-[380px] flex-shrink-0 snap-start relative"
              >
                <div
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-border/20"
                  style={{
                    background: b.bg_image_url
                      ? `url(${b.bg_image_url}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 60%, ${bgColor}99 100%)`,
                  }}
                >
                  {b.bg_image_url && (
                    <div className="absolute inset-0" style={{ background: `${bgColor}88` }} />
                  )}

                  <div
                    className="absolute -right-4 -bottom-2 text-[100px] sm:text-[120px] md:text-[140px] font-black leading-none select-none pointer-events-none"
                    style={{ color: "rgba(0,0,0,0.06)" }}
                  >
                    %
                  </div>

                  <div className="absolute right-[60px] sm:right-[72px] md:right-[80px] top-3 bottom-3 border-r-2 border-dashed border-foreground/10" />

                  <div className="flex">
                    <div className="flex-1 p-4 sm:p-5 md:p-6 pr-16 sm:pr-20 md:pr-24 relative z-10">
                      {(b.logo_url || b.subtitle) && (
                        <div className="flex items-center gap-2 mb-2">
                          {b.logo_url && (
                            <img src={b.logo_url} alt="" width="80" height="22" className="w-[70px] h-[20px] sm:w-[80px] sm:h-[22px] md:w-[100px] md:h-[26px] object-contain" loading="lazy" decoding="async" />
                          )}
                          {b.subtitle && (
                            <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-foreground/70 uppercase tracking-wider">{b.subtitle}</span>
                          )}
                        </div>
                      )}
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-foreground leading-tight">{b.title}</h3>
                      {b.description && (
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-foreground/50 mt-1.5 sm:mt-2 font-medium line-clamp-2">{b.description}</p>
                      )}
                      {b.cta_text && (
                        <span className="inline-block mt-2 sm:mt-3 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] md:text-xs font-bold rounded-full bg-foreground/90 text-background tracking-wide">{b.cta_text}</span>
                      )}
                    </div>

                    <div className="w-[60px] sm:w-[72px] md:w-[80px] flex items-center justify-center relative overflow-hidden">
                      {b.image_url ? (
                        <img src={b.image_url} alt="" className="w-full h-full object-cover absolute inset-0" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black rotate-[-90deg] select-none whitespace-nowrap" style={{ color: "rgba(0,0,0,0.08)" }}>OFF</span>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-[56px] sm:right-[68px] md:right-[76px] -top-3 w-6 h-6 rounded-full bg-background" />
                  <div className="absolute right-[56px] sm:right-[68px] md:right-[76px] -bottom-3 w-6 h-6 rounded-full bg-background" />
                </div>
              </div>
            );

            return b.link ? (
              <Link key={b.id} to={b.link} className="flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 snap-start">
                {card}
              </Link>
            ) : (
              <div key={b.id} className="flex-shrink-0 snap-start">{card}</div>
            );
          })}
        </div>

        {banners.length > 2 && (
          <>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/95 shadow-lg flex items-center justify-center hover:bg-muted active:scale-95 transition-all z-10 border border-border/30 hidden sm:flex">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/95 shadow-lg flex items-center justify-center hover:bg-muted active:scale-95 transition-all z-10 border border-border/30 hidden sm:flex">
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
