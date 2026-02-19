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
    <section className="relative py-4 md:py-8 section-container" aria-label="Featured promotions">
      <div className="relative overflow-hidden rounded-2xl" style={{ backgroundColor: slide.bgColor }}>
        <div className="flex items-center min-h-[220px] md:min-h-[350px] px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="max-w-xs md:max-w-md"
            >
              <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4">
                {slide.title}
              </h1>
              <Link
                to="/shop"
                className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider rounded-md hover:bg-primary/90 transition-colors"
              >
                {slide.cta}
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Decorative image on right */}
          <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-24 h-24 md:w-40 md:h-40 opacity-60">
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
              loading={current === 0 ? "eager" : "lazy"}
            />
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setCurrent((p) => (p + 1) % heroSlides.length)}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
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
