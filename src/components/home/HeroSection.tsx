import { useState, useEffect, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { heroSlides as fallbackSlides } from "@/data/mockData";
import { AnimatePresence, motion } from "framer-motion";

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
        <div className="overflow-hidden rounded-2xl lg:rounded-3xl bg-muted/40 h-[220px] sm:aspect-[2/1] sm:h-auto md:aspect-[5/2] lg:aspect-[3/1] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;
  const slide = slides[current];

  return (
    <section className="relative py-3 sm:py-4 md:py-6 lg:py-8 section-container animate-fade-in" aria-label="Featured promotions">
      <div className="relative">
        {/* Navigation arrows - hidden on mobile, visible on tablet+ */}
        <button
          onClick={prev}
          className="hidden sm:flex absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-card border border-border shadow-sm items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="hidden sm:flex absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-card border border-border shadow-sm items-center justify-center text-foreground hover:bg-muted transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>

        {/* Slide card */}
        <div className="overflow-hidden rounded-2xl lg:rounded-3xl relative h-[220px] sm:h-[250px] md:h-auto md:aspect-[5/2] lg:aspect-[3/1]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
              style={{ backgroundColor: slide.bgColor }}
            >
              <div className="flex items-center h-full px-5 sm:px-10 md:px-16 lg:px-20">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="relative z-10 max-w-[50%] sm:max-w-[50%] md:max-w-md lg:max-w-lg xl:max-w-xl space-y-3 sm:space-y-3 md:space-y-5"
                >
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-bold text-foreground leading-[1.15] tracking-tight whitespace-pre-line">
                    {slide.title}
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  >
                    <Link
                      to={slide.link}
                      className="inline-block px-5 sm:px-6 md:px-8 py-2.5 sm:py-2.5 md:py-3 bg-primary text-primary-foreground text-xs sm:text-xs md:text-sm font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
                    >
                      {slide.cta}
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.55, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-3 sm:right-8 md:right-12 lg:right-16 top-1/2 -translate-y-1/2 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] xl:w-[280px] xl:h-[280px]"
                >
                  {slide.image && (
                    <img
                      src={slide.image}
                      alt={slide.title || "Promotion"}
                      width={280}
                      height={280}
                      decoding="async"
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg"
                      loading={current === 0 ? "eager" : "lazy"}
                      fetchPriority={current === 0 ? "high" : "auto"}
                    />
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots & counter */}
      <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium tabular-nums">
          {current + 1}/{slides.length}
        </span>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i === current ? "w-5 sm:w-7 bg-foreground" : "w-1.5 sm:w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
