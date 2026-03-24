import { memo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;

  // Facebook
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true`;
  }

  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;

  // Instagram
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed/`;

  return null;
};

const GiftingStories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

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

  const handleClick = (s: any) => {
    if (!s.video_url) return;
    const embed = getEmbedUrl(s.video_url);
    if (embed) {
      setActiveVideo(embed);
    } else {
      window.open(s.video_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <section className="py-4 sm:py-6 md:py-8 section-container" style={{ contain: "layout style" }}>
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
              <button
                key={s.id}
                onClick={() => handleClick(s)}
                className="relative min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] aspect-[3/4] rounded-2xl overflow-hidden flex-shrink-0 group shadow-md text-left"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {s.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/35 transition-colors border border-white/30">
                      <Play size={20} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm sm:text-base font-semibold truncate flex items-center gap-1.5">
                    {s.label || s.title}
                    <ChevronRight size={14} className="text-white/80 flex-shrink-0" />
                  </p>
                </div>
              </button>
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

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveVideo(null)}>
          <div className="relative w-[280px] h-[500px] sm:w-[320px] sm:h-[570px]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <iframe
              src={activeVideo}
              className="w-full h-full rounded-2xl border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Video"
            />
          </div>
        </div>
      )}
    </>
  );
});

GiftingStories.displayName = "GiftingStories";
export default GiftingStories;
