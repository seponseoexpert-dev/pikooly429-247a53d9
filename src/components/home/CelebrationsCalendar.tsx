import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const CelebrationsCalendar = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: celebrations = [] } = useQuery({
    queryKey: ["celebrations-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("celebrations")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (celebrations.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="section-heading font-display font-semibold text-foreground mb-3 sm:mb-4 md:mb-6">
        Celebrations Calendar
      </h2>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth-ios pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {celebrations.map((c: any) => {
            const card = (
              <div className="min-w-[150px] w-[40vw] max-w-[240px] sm:min-w-[180px] md:min-w-[220px] flex-shrink-0 snap-start group">
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[4/5] bg-secondary border border-border/30 group-hover:shadow-lg transition-all duration-200">
                  <img
                    src={c.image_url || "/placeholder.svg"}
                    alt={c.name}
                    width={240}
                    height={300}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 480px) 40vw, (max-width: 640px) 180px, (max-width: 768px) 220px, 240px"
                  />
                  <div className="absolute top-0 left-0 right-0">
                    <div className="mx-auto w-[85%] bg-muted/80 backdrop-blur-sm text-center py-1 sm:py-1.5 rounded-b-xl">
                      <span className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground tracking-wide uppercase">
                        {c.date_label}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-foreground/80 text-center mt-2 group-hover:text-primary transition-colors line-clamp-1">
                  {c.name}
                </p>
              </div>
            );

            return c.link ? (
              <Link key={c.id} to={c.link} className="flex-shrink-0 snap-start">
                {card}
              </Link>
            ) : (
              <div key={c.id} className="flex-shrink-0 snap-start">{card}</div>
            );
          })}
        </div>

        {celebrations.length > 4 && (
          <>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-9 h-9 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted active:scale-95 transition-all z-10 hidden sm:flex">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-9 h-9 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted active:scale-95 transition-all z-10 hidden sm:flex">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
});

CelebrationsCalendar.displayName = "CelebrationsCalendar";
export default CelebrationsCalendar;
