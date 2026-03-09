import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play, Eye, Share2 } from "lucide-react";

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

  const formatViews = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6">
        Joyful Gifting Stories
      </h2>

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
              className="relative min-w-[140px] sm:min-w-[160px] md:min-w-[180px] aspect-[9/16] rounded-xl overflow-hidden flex-shrink-0 group"
            >
              <img
                src={s.thumbnail_url || "/placeholder.svg"}
                alt={s.title}
                width={180}
                height={320}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 180px"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* Top bar */}
              <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-2.5">
                {s.views_count > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-white/90 font-medium">
                    <Eye size={12} /> {formatViews(s.views_count)}
                  </span>
                )}
                <Share2 size={14} className="text-white/80" />
              </div>

              {/* Play button */}
              {s.video_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors">
                    <Play size={20} className="text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Bottom label */}
              {s.label && (
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <span className="inline-block bg-primary/90 text-primary-foreground text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {s.label}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>

        {stories.length > 4 && (
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

GiftingStories.displayName = "GiftingStories";
export default GiftingStories;
