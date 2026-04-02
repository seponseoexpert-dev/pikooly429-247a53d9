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

  useEffect(() => {
    if (slides.length > 0 && slides[0]?.image_url) {
      const existing = document.querySelector(`link[href="${slides[0].image_url}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = slides[0].image_url;
        link.fetchPriority = "high";
        document.head.appendChild(link);
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
  const bgColor = slide?.bg_color || "hsl(85 20% 92%)";
  const hasBgImage = !!slide?.bg_image_url;

  return (
    <section className="section-container py-3 sm:py-4 lg:py-6" style={{ contain: "layout style" }}>
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl transition-colors duration-500"
          style={{
            backgroundColor: bgColor,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasBgImage ? (
            /* Full background image — image only, no text overlay */
            <Link
              to={slide?.link || "/shop"}
              className="block relative min-h-[180px] sm:min-h-[240px] md:min-h-[300px] lg:min-h-[400px] xl:min-h-[440px] cursor-pointer"
              aria-label={slide?.title || "Banner"}
            >
              <img
                src={slide.bg_image_url!}
                alt={slide?.title || "Banner"}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
              />
            </Link>
          ) : (
            /* Default split layout mode */
            <div className="grid grid-cols-2 min-h-[200px] sm:min-h-[240px] md:min-h-[300px] lg:min-h-[400px] xl:min-h-[440px]">
              {/* Left: Text */}
              <div className="flex flex-col justify-center pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-20 py-5 sm:py-8 md:py-10 lg:py-14">
                {slide?.subtitle && (
                  <p className="text-[9px] sm:text-[11px] md:text-xs lg:text-sm font-medium text-muted-foreground/70 mb-0.5 sm:mb-1 lg:mb-2 tracking-widest uppercase italic">
                    {slide.subtitle}
                  </p>
                )}
                <h2 className="font-display text-base sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-snug sm:leading-tight lg:leading-[1.15]">
                  {slide?.title || "\u00A0"}
                </h2>
                {slide?.link && (
                  <div className="mt-2.5 sm:mt-3 md:mt-4 lg:mt-6">
                    <Link
                      to={slide.link}
                      className="group inline-flex items-center gap-1 sm:gap-1.5 lg:gap-2 bg-primary text-primary-foreground font-sans font-semibold text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 rounded-full tracking-wider uppercase whitespace-nowrap hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all duration-300"
                    >
                      {slide.cta_text || "SHOP NOW"}
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
              {/* Right: Image */}
              <div className="flex items-center justify-center pr-3 sm:pr-5 md:pr-8 lg:pr-14 xl:pr-20 py-4 sm:py-6 md:py-8">
                {slide?.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    width={400}
                    height={400}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px] xl:max-w-[400px] aspect-square object-cover rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg lg:shadow-2xl"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 260px, (max-width: 1280px) 340px, 400px"
                  />
                ) : (
                  <div className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px] xl:max-w-[400px] aspect-square rounded-xl sm:rounded-2xl lg:rounded-3xl bg-muted/50" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all duration-200 touch-target"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all duration-200 touch-target"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex flex-col items-center gap-2 mt-3 lg:mt-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-sans">
                {current + 1}/{slides.length}
              </span>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === current
                        ? "bg-primary w-7"
                        : "bg-muted-foreground/25 w-2 hover:bg-muted-foreground/40"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
