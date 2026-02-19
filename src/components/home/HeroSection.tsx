import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data/mockData";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative py-3 sm:py-4 md:py-6 lg:py-8 section-container" aria-label="Featured promotions">
      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl" style={{ backgroundColor: slide.bgColor }}>
        <div className="flex items-center min-h-[200px] sm:min-h-[240px] md:min-h-[300px] lg:min-h-[380px] xl:min-h-[420px] px-5 sm:px-8 md:px-12 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="max-w-[55%] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-bold text-foreground leading-tight mb-3 md:mb-5">
                {slide.title}
              </h1>
              <Link
                to="/shop"
                className="inline-block px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-primary text-primary-foreground text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wider rounded-md hover:bg-primary/90 transition-colors"
              >
                {slide.cta}
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Decorative image on right */}
          <div className="absolute right-3 sm:right-6 md:right-10 lg:right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-52 lg:h-52 xl:w-60 xl:h-60">
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover rounded-2xl lg:rounded-3xl"
              loading={current === 0 ? "eager" : "lazy"}
            />
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setCurrent((p) => (p + 1) % heroSlides.length)}
          className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots with counter */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {current + 1}/{heroSlides.length}
        </span>
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-foreground" : "w-2 bg-border"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
