import { useRef, memo, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  children: ReactNode;
  className?: string;
}

const ProductCarousel = memo(({ children, className = "" }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -w : w, behavior: "smooth" });
  };

  return (
    <div className={`relative group/carousel ${className}`}>
      {/* Scroll Arrows - desktop only */}
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-card border border-border/60 shadow-lg text-foreground/70 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scroll("right")}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-card border border-border/60 shadow-lg text-foreground/70 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollPaddingInline: "4px" }}
      >
        {children}
      </div>
    </div>
  );
});

ProductCarousel.displayName = "ProductCarousel";

export default ProductCarousel;
