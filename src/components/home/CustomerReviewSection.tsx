import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

const CustomerReviewSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="Customer Reviews">
      <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-4 md:mb-6 text-center">
        Customer Reviews
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible"
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink bg-card border border-border/50 rounded-xl p-4 sm:p-5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  "{review.comment}"
                </p>
              )}
              <div className="mt-auto pt-1">
                <span className="text-xs sm:text-sm font-semibold text-foreground">{review.customer_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CustomerReviewSection;
