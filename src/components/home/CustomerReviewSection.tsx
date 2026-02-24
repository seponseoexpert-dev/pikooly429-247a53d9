import { Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, useEffect } from "react";

const CustomerReviewSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, customer_name, rating, comment, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto-scroll on mobile
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  useEffect(() => {
    if (!scrollRef.current || reviews.length === 0) return;
    const card = scrollRef.current.children[activeIndex] as HTMLElement;
    if (card) {
      scrollRef.current.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
    }
  }, [activeIndex, reviews.length]);

  if (!isLoading && reviews.length === 0) return null;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section className="py-6 sm:py-8 md:py-12 section-container" aria-label="Customer Reviews">
      {/* Header */}
      <div className="text-center mb-5 md:mb-8">
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground">
          Customer Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{avgRating}</span>
            <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible"
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="min-w-[280px] sm:min-w-[300px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink bg-card border border-border/50 rounded-xl p-4 sm:p-5 flex flex-col gap-3 relative hover:shadow-md transition-shadow duration-200"
              >
                <Quote size={20} className="text-primary/20 absolute top-3 right-3" />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                )}
                <div className="mt-auto pt-2 border-t border-border/30">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{review.customer_name}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots indicator for mobile */}
          {reviews.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 md:hidden">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "bg-primary w-4" : "bg-border"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CustomerReviewSection;
