import { memo, useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
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

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((p) => (p + 1) % slides.length);
    }, 20000);
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
      diff > 0 ? next() : prev();
    }
  };

  if (slides.length === 0) return null;

  const slide = slides[current];

  const bgColor = slide.bg_color || "hsl(85 20% 92%)";

  return (
    <section className="section-container py-3 sm:py-4">
      <div className="relative">
        {/* Banner */}
        <motion.div
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl"
          animate={{ backgroundColor: bgColor }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 min-h-[200px] sm:min-h-[240px] md:min-h-[300px] lg:min-h-[380px]"
            >
              {/* Left: Text */}
              <div className="flex flex-col justify-center pl-5 sm:pl-8 md:pl-12 lg:pl-16 py-6 sm:py-8 md:py-10 lg:py-12">
                {slide.subtitle && (
                  <motion.p
                    key={`subtitle-${slide.id}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5 tracking-wide"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
                <motion.h2
                  key={`title-${slide.id}`}
                  initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-lg sm:text-2xl md:text-3xl lg:text-5xl font-bold text-foreground leading-snug sm:leading-tight"
                >
                  {slide.title}
                </motion.h2>

                {slide.link && (
                  <motion.div
                    key={`cta-${slide.id}`}
                    initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 sm:mt-4 md:mt-5"
                  >
                    <Link
                      to={slide.link}
                      className="group inline-flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground font-sans font-semibold text-[11px] sm:text-xs md:text-sm lg:text-base px-4 sm:px-5 md:px-7 lg:px-8 py-2 sm:py-2.5 md:py-3 rounded-full tracking-wide uppercase whitespace-nowrap hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all duration-300 touch-target"
                    >
                      {slide.cta_text || "ORDER NOW"}
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Right: Image */}
              <div className="flex items-center justify-center pr-3 sm:pr-5 md:pr-8 lg:pr-14 py-4 sm:py-6 md:py-8">
                {slide.image_url && (
                  <motion.img
                    key={`img-${slide.id}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[320px] aspect-square object-cover rounded-xl sm:rounded-2xl shadow-lg"
                    loading="eager"
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

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

        {/* Dots + Progress */}
        {slides.length > 1 && (
          <div className="flex flex-col items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
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
                      "h-2 rounded-full transition-all duration-300 relative overflow-hidden",
                      i === current
                        ? "bg-muted-foreground/15 w-7"
                        : "bg-muted-foreground/25 w-2 hover:bg-muted-foreground/40"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    {i === current && (
                      <motion.span
                        key={`progress-${current}`}
                        className="absolute inset-0 bg-primary rounded-full origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 20, ease: "easeInOut" }}
                      />
                    )}
                  </button>
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
