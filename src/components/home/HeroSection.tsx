import { memo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link: string | null;
  cta_text: string | null;
  bg_color: string | null;
  bg_image_url: string | null;
  display_order: number;
}

const HeroSection = memo(() => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  const { data: slides = [] } = useQuery({
    queryKey: ["homepage-sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Slide[];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Preload LCP image as early as possible
  useEffect(() => {
    if (slides.length > 0) {
      const firstImg = slides[0]?.bg_image_url || slides[0]?.image_url;
      if (firstImg) {
        const existing = document.querySelector(`link[href="${firstImg}"]`);
        if (!existing) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = firstImg;
          (link as any).fetchPriority = "high";
          // Insert at top of head for earliest discovery
          document.head.insertBefore(link, document.head.firstChild);
        }
      }
    }
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  const slide = slides[current];
  const bgColor = slide?.bg_color || "hsl(152 20% 94%)";
  const hasBgImage = !!slide?.bg_image_url;

  return (
    <section className="section-container py-2.5 sm:py-4 lg:py-6" style={{ contain: "layout style", minHeight: "clamp(140px, 25vw, 280px)" }}>
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-[20px] transition-colors duration-500"
          style={{ backgroundColor: bgColor }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasBgImage ? (
            <Link
              to={slide?.link || "/shop"}
              className="block relative w-full aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5.5] xl:aspect-[16/5] cursor-pointer"
              aria-label={slide?.title || "Banner"}
            >
              <img
                src={slide.bg_image_url!}
                alt={slide?.title || "Banner"}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                loading="eager"
              />
            </Link>
          ) : (
            <div className="grid grid-cols-2 aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5.5] xl:aspect-[16/5]">
              <div className="flex flex-col justify-center pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-20 py-4 sm:py-6 md:py-8 lg:py-10">
                {slide?.subtitle && (
                  <p className="text-[9px] sm:text-[11px] md:text-xs lg:text-sm font-medium text-muted-foreground/70 mb-0.5 sm:mb-1 lg:mb-2 tracking-widest uppercase">
                    {slide.subtitle}
                  </p>
                )}
                <h2 className="font-display font-bold text-foreground leading-snug sm:leading-tight"
                  style={{ fontSize: "clamp(0.875rem, 3vw, 3rem)" }}
                >
                  {slide?.title || "\u00A0"}
                </h2>
                {slide?.link && (
                  <div className="mt-2 sm:mt-3 md:mt-5 lg:mt-6">
                    <Link
                      to={slide.link}
                      className="group inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-sans font-semibold text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-3 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg tracking-wider uppercase whitespace-nowrap hover:shadow-lg active:scale-[0.97] transition-all duration-300"
                    >
                      {slide.cta_text || "SHOP NOW"}
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center pr-3 sm:pr-5 md:pr-8 lg:pr-14 xl:pr-20 py-3 sm:py-4 md:py-6">
                {slide?.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    width={400}
                    height={400}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full max-w-[120px] sm:max-w-[160px] md:max-w-[220px] lg:max-w-[300px] xl:max-w-[380px] aspect-square object-cover rounded-xl sm:rounded-2xl shadow-lg"
                    sizes="(max-width: 480px) 120px, (max-width: 640px) 160px, (max-width: 768px) 220px, (max-width: 1024px) 300px, 380px"
                  />
                ) : (
                  <div className="w-full max-w-[120px] sm:max-w-[160px] md:max-w-[220px] lg:max-w-[300px] xl:max-w-[380px] aspect-square rounded-xl sm:rounded-2xl bg-muted/30" />
                )}
              </div>
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1.5 sm:left-2.5 lg:-left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-sm border border-border/40 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-card transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-1.5 sm:right-2.5 lg:-right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-sm border border-border/40 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-card transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2.5 sm:mt-3">
            <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
              {current + 1}/{slides.length}
            </span>
            <div className="flex items-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === current
                      ? "bg-primary w-5"
                      : "bg-border w-1.5 hover:bg-muted-foreground/30"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
