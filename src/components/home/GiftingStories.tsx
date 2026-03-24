import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const GiftingStories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: stories = [] } = useQuery({
    queryKey: ["gifting-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gifting_stories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (stories.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      {/* Header with reel icon */}
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Play size={16} className="text-primary fill-primary ml-0.5" />
        </div>
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground">
          Shop Reel
        </h2>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {stories.map((s: any) => (
            <a
              key={s.id}
              href={s.video_url || "#"}
              target={s.video_url ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="relative min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] aspect-[3/4] rounded-2xl overflow-hidden flex-shrink-0 group shadow-md"
            >
              <img
                src={s.thumbnail_url || "/placeholder.svg"}
                alt={s.title}
                width={200}
                height={267}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Play button center */}
              {s.video_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/35 transition-colors border border-white/30">
                    <Play size={20} className="text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm sm:text-base font-semibold truncate flex items-center gap-1.5">
                  {s.label || s.title}
                  <ChevronRight size={14} className="text-white/80 flex-shrink-0" />
                </p>
              </div>
            </a>
          ))}
        </div>

        {stories.length > 2 && (
          <>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-8 h-8 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10 hidden sm:flex">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-8 h-8 rounded-full bg-card/90 shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10 hidden sm:flex">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
});

GiftingStories.displayName = "GiftingStories";
export default GiftingStories;
