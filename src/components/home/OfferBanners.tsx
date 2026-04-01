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
            const bgColor = b.bg_color || "hsl(var(--secondary))";

            const card = (
              <div
                key={b.id}
                className="min-w-[300px] sm:min-w-[340px] md:min-w-[380px] flex-shrink-0 relative"
              >
                {/* Ticket-style card */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-md border border-border/20"
                  style={{
                    background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 60%, ${bgColor}99 100%)`,
                  }}
                >
                  {/* Decorative large watermark */}
                  <div
                    className="absolute -right-4 -bottom-2 text-[120px] sm:text-[140px] font-black leading-none select-none pointer-events-none"
                    style={{ color: "rgba(0,0,0,0.06)" }}
                  >
                    %
                  </div>

                  {/* Dashed ticket divider */}
                  <div className="absolute right-[72px] sm:right-[80px] top-3 bottom-3 border-r-2 border-dashed border-foreground/10" />

                  <div className="flex">
                    {/* Main content */}
                    <div className="flex-1 p-5 sm:p-6 pr-20 sm:pr-24 relative z-10">
                      {b.logo_url && (
                        <img src={b.logo_url} alt="" width="100" height="24" className="w-[100px] h-[24px] sm:w-[120px] sm:h-[28px] mb-3 object-contain" loading="lazy" decoding="async" />
                      )}
                      {b.subtitle && (
                        <p className="text-[11px] sm:text-xs font-bold text-foreground/70 uppercase tracking-wider">{b.subtitle}</p>
                      )}
                      <h3 className="text-2xl sm:text-3xl md:text-[34px] font-display font-extrabold text-foreground mt-1 leading-tight">{b.title}</h3>
                      {b.description && (
                        <p className="text-[9px] sm:text-[10px] text-foreground/50 mt-2 font-medium">{b.description}</p>
                      )}
                      {b.cta_text && (
                        <span className="inline-block mt-3 px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-full bg-foreground/90 text-background tracking-wide">{b.cta_text}</span>
                      )}
                    </div>

                    {/* Right ticket stub with image or watermark */}
                    <div className="w-[72px] sm:w-[80px] flex items-center justify-center relative overflow-hidden">
                      {b.image_url ? (
                        <img src={b.image_url} alt="" className="w-full h-full object-cover absolute inset-0" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-3xl sm:text-4xl font-black rotate-[-90deg] select-none whitespace-nowrap" style={{ color: "rgba(0,0,0,0.08)" }}>OFF</span>
                      )}
                    </div>
                  </div>

                  {/* Top & bottom notches for ticket effect */}
                  <div className="absolute right-[68px] sm:right-[76px] -top-3 w-6 h-6 rounded-full bg-background" />
                  <div className="absolute right-[68px] sm:right-[76px] -bottom-3 w-6 h-6 rounded-full bg-background" />
                </div>
              </div>
            );

            return b.link ? (
              <Link key={b.id} to={b.link} className="flex-shrink-0 hover:scale-[1.02] transition-transform duration-200">
                {card}
              </Link>
            ) : (
              <div key={b.id} className="flex-shrink-0">{card}</div>
            );
          })}
        </div>

        {banners.length > 2 && (
          <>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-9 h-9 rounded-full bg-card/95 shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-10 border border-border/30">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-9 h-9 rounded-full bg-card/95 shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-10 border border-border/30">
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
