import { Star, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, useEffect, useCallback } from "react";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-olive", "bg-primary", "bg-sage", "bg-gold",
    "hsl(142 40% 35%)", "hsl(200 40% 40%)", "hsl(280 30% 45%)", "hsl(20 50% 45%)"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const ReviewCard = ({ review }: { review: Review }) => {
  const [expanded, setExpanded] = useState(false);
  const comment = review.comment?.trim() ?? "";
  const hasLongComment = comment.length > 100;
  const initials = getInitials(review.customer_name);
  const avatarColor = getAvatarColor(review.customer_name);
  const isClassName = avatarColor.startsWith("bg-");

  return (
    <div className="min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink bg-card border border-border/30 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${isClassName ? avatarColor : ""}`}
          style={!isClassName ? { backgroundColor: avatarColor } : undefined}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
              {review.customer_name}
            </span>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              • {timeAgo(review.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment */}
      {comment && (
        <div className="min-w-0">
          <p
            className={`text-[13px] text-foreground/80 leading-[1.6] text-left whitespace-normal break-words ${!expanded && hasLongComment ? "line-clamp-2" : ""}`}
          >
            {comment}
          </p>
          {hasLongComment && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="text-xs text-primary font-medium mt-1 hover:underline"
            >
              {expanded ? "show less" : "read more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const CustomerReviewSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [desktopPage, setDesktopPage] = useState(0);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, customer_name, rating, comment, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const cardsPerPage = 4;
  const totalDesktopPages = Math.ceil(reviews.length / cardsPerPage);

  // Mobile auto-scroll
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  useEffect(() => {
    if (!scrollRef.current || reviews.length === 0) return;
    const card = scrollRef.current.children[activeIndex] as HTMLElement;
    if (card) {
      scrollRef.current.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
    }
  }, [activeIndex, reviews.length]);

  // Desktop auto-slide
  useEffect(() => {
    if (totalDesktopPages <= 1) return;
    const interval = setInterval(() => {
      setDesktopPage((prev) => (prev + 1) % totalDesktopPages);
    }, 30000);
    return () => clearInterval(interval);
  }, [totalDesktopPages]);

  const goDesktopPrev = useCallback(() => {
    setDesktopPage((prev) => (prev - 1 + totalDesktopPages) % totalDesktopPages);
  }, [totalDesktopPages]);

  const goDesktopNext = useCallback(() => {
    setDesktopPage((prev) => (prev + 1) % totalDesktopPages);
  }, [totalDesktopPages]);

  const desktopReviews = reviews.slice(desktopPage * cardsPerPage, desktopPage * cardsPerPage + cardsPerPage);

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-12 section-container" aria-label="Customer Reviews">
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5 mb-5 md:mb-8 md:flex-row md:justify-between">
        <div className="hidden md:block md:flex-1" />
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground text-center">
          Customer Reviews
        </h2>
        <div className="md:flex-1 flex md:justify-end">
          <a href="/reviews" className="text-xs md:text-sm font-medium text-primary hover:underline transition-colors">
            Show All Reviews
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile: horizontal scroll */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3 -mx-4 px-4 md:hidden"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Desktop: 4-card slider */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-4 gap-4 transition-all duration-300">
              {desktopReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {totalDesktopPages > 1 && (
              <>
                <button
                  onClick={goDesktopPrev}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft size={16} className="text-foreground" />
                </button>
                <button
                  onClick={goDesktopNext}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="Next reviews"
                >
                  <ChevronRight size={16} className="text-foreground" />
                </button>
              </>
            )}

            {totalDesktopPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {Array.from({ length: totalDesktopPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDesktopPage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === desktopPage ? "bg-primary w-4" : "bg-border"
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile dots */}
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
