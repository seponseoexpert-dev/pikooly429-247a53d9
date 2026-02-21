import { useState, useEffect, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { heroSlides as fallbackSlides } from "@/data/mockData";

const HeroSection = memo(() => {
  const [current, setCurrent] = useState(0);

  const { data: dbSliders, isLoading } = useQuery({
    queryKey: ["sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = dbSliders && dbSliders.length > 0
    ? dbSliders.map((s) => ({
        title: s.title,
        cta: s.cta_text || "ORDER NOW",
        image: s.image_url || "",
        bgColor: s.bg_color || "#d4e8d0",
        link: s.link || "/shop",
      }))
    : !isLoading
      ? fallbackSlides.map((s) => ({ ...s, link: "/shop" }))
      : [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length && slides.length > 0) setCurrent(0);
  }, [slides.length, current]);

  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);

  if (isLoading) {
    return (
      <section className="relative py-3 sm:py-4 md:py-6 lg:py-8 section-container">
        <div className="overflow-hidden rounded-2xl lg:rounded-3xl bg-muted animate-pulse min-h-[220px] sm:min-h-[260px] md:min-h-[320px] lg:min-h-[400px] xl:min-h-[440px]" />
      </section>
    );
  }

  if (slides.length === 0) return null;
  const slide = slides[current];

  return (
    <section className="relative py-3 sm:py-4 md:py-6 lg:py-8 section-container" aria-label="Featured promotions">
      <div className="relative">
        {/* Navigation arrows outside the card */}
        <button
          onClick={prev}
          className="absolute -left-1 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="absolute -right-1 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>

        {/* Slide card */}
        <div className="overflow-hidden rounded-2xl lg:rounded-3xl transition-colors duration-500" style={{ backgroundColor: slide.bgColor }}>
          <div className="flex items-center min-h-[220px] sm:min-h-[260px] md:min-h-[320px] lg:min-h-[400px] xl:min-h-[440px] px-8 sm:px-12 md:px-16 lg:px-20">
            <div className="relative z-10 max-w-[55%] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl space-y-4 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground leading-[1.15] tracking-tight whitespace-pre-line">
                {slide.title}
              </h1>
              <Link
                to={slide.link}
                className="inline-block px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 bg-primary text-primary-foreground text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.15em] rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
              >
                {slide.cta}
              </Link>
            </div>

            <div className="absolute right-6 sm:right-10 md:right-14 lg:right-20 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64">
              {slide.image && (
                <img
                  src={slide.image}
                  alt={slide.title || "Promotion"}
                  width={256}
                  height={256}
                  decoding="async"
                  className="w-full h-full object-cover rounded-2xl lg:rounded-3xl shadow-lg"
                  loading={current === 0 ? "eager" : "lazy"}
                  fetchPriority={current === 0 ? "high" : "auto"}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 mt-4">
        <span className="text-xs text-muted-foreground font-medium">
          {current + 1}/{slides.length}
        </span>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-7 bg-foreground" : "w-2 bg-border hover:bg-muted-foreground/40"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
