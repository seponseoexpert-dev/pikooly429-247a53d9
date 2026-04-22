import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const PASTEL_COLORS = [
  "#f8d7da", "#d6eaf8", "#fef9e7", "#d5f5e3",
  "#f5eef8", "#fdebd0", "#d1f2eb", "#fadbd8",
];

// Parse "11TH APR" to render superscript TH/ST/ND/RD
const DateLabel = ({ label }: { label: string }) => {
  const match = label.match(/^(\d+)(ST|ND|RD|TH)\s+(.+)$/i);
  if (!match) return <span>{label}</span>;
  return (
    <span>
      {match[1]}<sup className="text-[7px] sm:text-[8px]">{match[2].toUpperCase()}</sup> {match[3].toUpperCase()}
    </span>
  );
};

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
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="py-3 sm:py-5 md:py-7 section-container" style={{ contain: "layout style" }}>
      <div className="mb-3 sm:mb-4">
        <h2 className="display-heading text-foreground font-bold leading-tight" style={{ fontSize: "clamp(1.25rem, 2vw + 0.5rem, 1.75rem)" }}>
          Celebrations Calendar
        </h2>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth-ios pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {celebrations.map((c: any, index: number) => {
            const bgColor = c.bg_color || PASTEL_COLORS[index % PASTEL_COLORS.length];

            const card = (
              <div className="w-[42vw] min-w-[42vw] sm:w-[30vw] sm:min-w-[30vw] md:w-[24vw] md:min-w-[24vw] lg:w-[18vw] lg:min-w-[18vw] xl:w-[16vw] xl:min-w-[16vw] max-w-[240px] flex-shrink-0 snap-start group">
                <div
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square transition-all duration-500 ease-out group-hover:shadow-lg group-hover:scale-[1.02]"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="absolute top-0 left-0 right-0 z-10">
                    <div
                      className="mx-auto w-[75%] text-center py-1 sm:py-1.5 rounded-b-lg sm:rounded-b-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.65)", backdropFilter: "blur(6px)" }}
                    >
                      <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-foreground tracking-wide">
                        <DateLabel label={c.date_label} />
                      </span>
                    </div>
                  </div>

                  <img
                    src={c.image_url || "/placeholder.svg"}
                    alt={c.name}
                    width={240}
                    height={240}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 42vw, (max-width: 768px) 30vw, (max-width: 1024px) 24vw, (max-width: 1280px) 18vw, 16vw"
                  />
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-foreground/80 text-center mt-1.5 sm:mt-2 group-hover:text-primary transition-colors line-clamp-1">
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

        {celebrations.length > 3 && (
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
