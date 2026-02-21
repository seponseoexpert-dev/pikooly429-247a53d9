import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data/mockData";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = useCallback(() => setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length), []);
  const next = useCallback(() => setCurrent((p) => (p + 1) % heroSlides.length), []);

  const slide = heroSlides[current];

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
            <div className="max-w-[55%] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl space-y-4 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground leading-[1.15] tracking-tight">
                {slide.title}
              </h1>
              <Link
                to="/shop"
                className="inline-block px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 bg-primary text-primary-foreground text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.15em] rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
              >
                {slide.cta}
              </Link>
            </div>

            <div className="absolute right-6 sm:right-10 md:right-14 lg:right-20 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64">
              <img
                src={slide.image}
                alt=""
                className="w-full h-full object-cover rounded-2xl lg:rounded-3xl shadow-lg"
                loading={current === 0 ? "eager" : "lazy"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 mt-4">
        <span className="text-xs text-muted-foreground font-medium">
          {current + 1}/{heroSlides.length}
        </span>
        {heroSlides.map((_, i) => (
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
};

export default HeroSection;
