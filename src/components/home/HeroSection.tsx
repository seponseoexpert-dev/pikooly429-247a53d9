import { memo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getOptimizedCloudinaryUrl } from "@/lib/imageUtils";

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

  const { data: slides = [], isLoading } = useQuery({
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

  // Preload LCP image as early as possible (CDN-optimised, mobile-sized)
  useEffect(() => {
    if (slides.length > 0) {
      const rawImg = slides[0]?.bg_image_url || slides[0]?.image_url;
      if (rawImg) {
        const isMobile = window.innerWidth < 640;
        const optImg = getOptimizedCloudinaryUrl(rawImg, isMobile ? 720 : 1280);
        const existing = document.querySelector(`link[href="${optImg}"]`);
        if (!existing) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = optImg;
          (link as any).fetchPriority = "high";
          document.head.insertBefore(link, document.head.firstChild);
        }
      }
    }
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 7000);
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
    <section className="section-container py-3 sm:py-5 lg:py-7" style={{ contain: "layout style", minHeight: "clamp(140px, 25vw, 280px)" }}>
      <div className="relative">
        <div
          className="luxe-card relative overflow-hidden rounded-2xl sm:rounded-[24px] lg:rounded-[28px] transition-colors duration-700 ease-luxe"
          style={{ backgroundColor: bgColor, boxShadow: "var(--shadow-luxe)" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Gold corner ornaments */}
          <span aria-hidden className="pointer-events-none absolute top-3 left-3 w-5 h-5 sm:w-6 sm:h-6 border-l border-t border-[hsl(var(--gold)/0.55)] rounded-tl-md z-10" />
          <span aria-hidden className="pointer-events-none absolute top-3 right-3 w-5 h-5 sm:w-6 sm:h-6 border-r border-t border-[hsl(var(--gold)/0.55)] rounded-tr-md z-10" />
          <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 w-5 h-5 sm:w-6 sm:h-6 border-l border-b border-[hsl(var(--gold)/0.55)] rounded-bl-md z-10" />
          <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 sm:w-6 sm:h-6 border-r border-b border-[hsl(var(--gold)/0.55)] rounded-br-md z-10" />

          {hasBgImage ? (
            <Link
              to={slide?.link || "/shop"}
              className="block premium-image relative w-full aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5.5] xl:aspect-[16/5] cursor-pointer"
              aria-label={slide?.title || "Banner"}
            >
              <img
                src={getOptimizedCloudinaryUrl(slide.bg_image_url!, typeof window !== "undefined" && window.innerWidth < 640 ? 720 : 1280)}
                alt={slide?.title || "Banner"}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                loading="eager"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1280px"
              />
              {/* Subtle gradient veil for legibility */}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent" />
            </Link>
          ) : (
            <div className="relative grid grid-cols-2 aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5.5] xl:aspect-[16/5]">
              {/* Decorative radial glow */}
              <span aria-hidden className="absolute -top-1/2 -right-1/4 w-[60%] h-[200%] rounded-full pointer-events-none" style={{ background: "radial-gradient(closest-side, hsl(var(--gold)/0.18), transparent 70%)" }} />

              <div className="relative z-10 flex flex-col justify-center pl-5 sm:pl-9 md:pl-14 lg:pl-20 xl:pl-24 py-4 sm:py-6 md:py-8 lg:py-10">
                {slide?.subtitle && (
                  <p className="eyebrow mb-1.5 sm:mb-2.5 lg:mb-3.5 text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs">
                    {slide.subtitle}
                  </p>
                )}
                <h2
                  className="font-display text-foreground leading-[1.05] tracking-tight"
                  style={{ fontSize: "clamp(1rem, 3.4vw, 3.4rem)", fontWeight: 500 }}
                >
                  {slide?.title || "\u00A0"}
                </h2>
                {slide?.link && (
                  <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-7">
                    <Link
                      to={slide.link}
                      className="btn-luxe group text-[10px] sm:text-[11px] md:text-xs lg:text-sm px-4 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-3.5 tracking-[0.18em] uppercase whitespace-nowrap"
                    >
                      {slide.cta_text || "Shop Now"}
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 ml-1 group-hover:translate-x-1 transition-transform duration-500 ease-luxe" />
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative z-10 flex items-center justify-center pr-3 sm:pr-5 md:pr-8 lg:pr-14 xl:pr-20 py-3 sm:py-4 md:py-6">
                {slide?.image_url ? (
                  <div className="relative">
                    <span aria-hidden className="absolute -inset-2 rounded-[28px] bg-gradient-gold opacity-25 blur-xl" />
                    <img
                      src={getOptimizedCloudinaryUrl(slide.image_url, 600)}
                      alt={slide.title}
                      width={400}
                      height={400}
                      fetchPriority="high"
                      decoding="async"
                      className="relative w-full max-w-[120px] sm:max-w-[160px] md:max-w-[220px] lg:max-w-[300px] xl:max-w-[380px] aspect-square object-cover rounded-2xl sm:rounded-[24px] shadow-luxe ring-1 ring-[hsl(var(--gold)/0.35)]"
                      sizes="(max-width: 480px) 120px, (max-width: 640px) 160px, (max-width: 768px) 220px, (max-width: 1024px) 300px, 380px"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[120px] sm:max-w-[160px] md:max-w-[220px] lg:max-w-[300px] xl:max-w-[380px] aspect-square rounded-2xl sm:rounded-[24px] bg-muted/30" />
                )}
              </div>
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-3 lg:-left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-card/95 backdrop-blur-md shadow-soft border border-[hsl(var(--gold)/0.30)] flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-card hover:border-[hsl(var(--gold)/0.6)] transition-all duration-500 ease-luxe"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-3 lg:-right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-card/95 backdrop-blur-md shadow-soft border border-[hsl(var(--gold)/0.30)] flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-card hover:border-[hsl(var(--gold)/0.6)] transition-all duration-500 ease-luxe"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2.5 mt-3 sm:mt-4">
            <span className="text-[10px] text-muted-foreground/60 font-semibold tabular-nums tracking-widest">
              {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-700 ease-luxe",
                    i === current
                      ? "bg-gradient-gold w-6"
                      : "bg-border w-1.5 hover:bg-muted-foreground/40"
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
