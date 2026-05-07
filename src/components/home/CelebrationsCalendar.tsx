import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const PASTEL_COLORS = [
  "#f8d7da", "#d6eaf8", "#fef9e7", "#d5f5e3",
  "#f5eef8", "#fdebd0", "#d1f2eb", "#fadbd8",
];

type CelebrationItem = Tables<"celebrations">;

const DateLabel = ({ label }: { label: string }) => {
  const match = label.match(/^(\d+)(ST|ND|RD|TH)\s+(.+)$/i);

  if (!match) {
    return <span>{label.toUpperCase()}</span>;
  }

  return (
    <span>
      {match[1]}
      <sup className="text-[7px] sm:text-[8px] align-super">{match[2].toUpperCase()}</sup>{" "}
      {match[3].toUpperCase()}
    </span>
  );
};

const CelebrationsCalendar = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: celebrations = [] } = useQuery<CelebrationItem[]>({
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

  const scroll = (direction: number) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <section className="section-container py-2 sm:py-4 md:py-5" style={{ contain: "layout style" }}>
      <div className="mb-3 sm:mb-4">
        <h2
          className="display-heading text-foreground font-bold leading-tight"
          style={{ fontSize: "clamp(1.2rem, 1.5vw + 0.9rem, 1.95rem)" }}
        >
          Celebrations Calendar
        </h2>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth-ios pb-2 -mx-4 px-4 snap-x snap-mandatory sm:mx-0 sm:px-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible"
        >
          {celebrations.map((celebration, index) => {
            const bgColor = celebration.bg_color || PASTEL_COLORS[index % PASTEL_COLORS.length];

            const card = (
              <div className="group w-[43vw] min-w-[43vw] flex-shrink-0 snap-start sm:w-[29vw] sm:min-w-[29vw] md:w-full md:min-w-0">
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-[22px] transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
                    <div className="rounded-md border-2 border-primary bg-white px-3 py-1 shadow-sm">
                      <span className="whitespace-nowrap text-[10px] font-bold tracking-wide text-foreground sm:text-[11px] md:text-xs">
                        <DateLabel label={celebration.date_label} />
                      </span>
                    </div>
                  </div>

                  <img
                    src={celebration.image_url || "/placeholder.svg"}
                    alt={celebration.name}
                    width={280}
                    height={350}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 43vw, (max-width: 768px) 29vw, (max-width: 1200px) 18vw, 16vw"
                  />
                </div>

                <p className="mt-2 text-center text-[12px] font-medium text-foreground transition-colors group-hover:text-primary sm:text-sm">
                  {celebration.name}
                </p>
              </div>
            );

            return celebration.link ? (
              <Link key={celebration.id} to={celebration.link} className="block md:min-w-0">
                {card}
              </Link>
            ) : (
              <div key={celebration.id} className="md:min-w-0">
                {card}
              </div>
            );
          })}
        </div>

        {celebrations.length > 5 && (
          <>
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-md transition-all hover:bg-muted active:scale-95 sm:flex md:hidden"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-md transition-all hover:bg-muted active:scale-95 sm:flex md:hidden"
            >
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
