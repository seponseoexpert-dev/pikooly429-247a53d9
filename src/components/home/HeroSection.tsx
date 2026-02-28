import { memo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  title: string;
  image_url: string | null;
  link: string | null;
  cta_text: string | null;
  bg_color: string | null;
  display_order: number;
}

const HeroSection = memo(() => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("sliders")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data);
      });
  }, []);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="section-container py-3 sm:py-4">
      <div className="relative">
        {/* Banner */}
        <div
          className="relative overflow-hidden rounded-2xl h-[220px] sm:h-[260px] md:h-[320px] lg:h-[380px]"
          style={{
            backgroundColor: slide.bg_color || "hsl(85 20% 92%)",
          }}
        >
          {/* Text content */}
          <div className="absolute left-5 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-10 max-w-[55%] sm:max-w-[50%]">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3 sm:mb-4 md:mb-5">
              {slide.title}
            </h2>
            {slide.link && (
              <Link
                to={slide.link}
                className="inline-block bg-primary text-primary-foreground font-sans font-semibold text-xs sm:text-sm md:text-base px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-lg tracking-wider uppercase hover:bg-primary/90 transition-colors touch-target"
              >
                {slide.cta_text || "BUY NOW"}
              </Link>
            )}
          </div>

          {/* Image */}
          {slide.image_url && (
            <div className="absolute right-3 sm:right-6 md:right-10 lg:right-16 top-1/2 -translate-y-1/2 w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[240px] md:h-[240px] lg:w-[300px] lg:h-[300px]">
              <img
                src={slide.image_url}
                alt={slide.title}
                className="w-full h-full object-cover rounded-xl shadow-lg"
                loading="eager"
              />
            </div>
          )}
        </div>

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors touch-target"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors touch-target"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-xs text-muted-foreground font-sans">
              {current + 1}/{slides.length}
            </span>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === current ? "bg-primary w-4" : "bg-muted-foreground/30"
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
