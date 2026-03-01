import { memo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);

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
      setDirection(1);
      setCurrent((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (slides.length === 0) return null;

  const slide = slides[current];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "60%" : "-60%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-60%" : "60%",
      opacity: 0,
    }),
  };

  return (
    <section className="section-container py-3 sm:py-4">
      <div className="relative">
        {/* Banner */}
        <div
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl h-[230px] sm:h-[270px] md:h-[330px] lg:h-[400px] transition-colors duration-500"
          style={{
            backgroundColor: slide.bg_color || "hsl(85 20% 92%)",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* Text content */}
              <div className="absolute left-5 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-10 max-w-[42%] sm:max-w-[45%] md:max-w-[50%]">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="font-display text-[22px] sm:text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.2] mb-3 sm:mb-4 md:mb-5"
                >
                  {slide.title}
                </motion.h2>
                {slide.link && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Link
                      to={slide.link}
                      className="inline-block bg-primary text-primary-foreground font-sans font-semibold text-xs sm:text-sm md:text-base px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-lg tracking-wider uppercase hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 touch-target shadow-md"
                    >
                      {slide.cta_text || "ORDER NOW"}
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Image */}
              {slide.image_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                  className="absolute right-3 sm:right-5 md:right-10 lg:right-16 top-1/2 -translate-y-1/2 w-[48%] sm:w-[46%] md:w-[250px] lg:w-[310px] h-[78%] sm:h-[82%] md:h-[250px] lg:h-[310px]"
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                    loading="eager"
                  />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all duration-200 touch-target"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all duration-200 touch-target"
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
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === current
                      ? "bg-primary w-5"
                      : "bg-muted-foreground/25 w-2 hover:bg-muted-foreground/40"
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
