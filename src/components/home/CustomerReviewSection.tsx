import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
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
    "hsl(152 32% 36%)", "hsl(200 35% 42%)", "hsl(38 65% 52%)",
    "hsl(260 25% 48%)", "hsl(340 30% 45%)", "hsl(180 25% 40%)", "hsl(20 40% 45%)"
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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  products?: { name: string; slug: string; image_url: string | null } | null;
};

const ReviewCard = ({ review }: { review: Review }) => {
  const [expanded, setExpanded] = useState(false);
  const comment = review.comment?.trim() ?? "";
  const hasLongComment = comment.length > 60;
  const initials = getInitials(review.customer_name);
  const avatarColor = getAvatarColor(review.customer_name);

  return (
    <div className="w-[calc(100vw-48px)] min-w-[calc(100vw-48px)] sm:w-[280px] sm:min-w-[280px] md:w-auto md:min-w-0 snap-center flex-shrink-0 md:flex-shrink bg-card border border-border/30 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 hover:border-border transition-all duration-300">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {review.customer_name}
            </span>
            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
              {timeAgo(review.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-border"}
              />
            ))}
          </div>
        </div>
      </div>

      {comment && (
        <div className="min-w-0">
          <p className={`text-[13px] text-muted-foreground leading-[1.6] text-left ${!expanded && hasLongComment ? "line-clamp-3" : ""}`}>
            {comment}
          </p>
          {hasLongComment && (
            <button onClick={() => setExpanded((prev) => !prev)} className="text-xs text-primary font-medium mt-1 hover:underline">
              {expanded ? "show less" : "read more"}
            </button>
          )}
        </div>
      )}

      {review.products && (
        <a
          href={`/product/${review.products.slug}`}
          className="flex items-center gap-2 mt-auto pt-2.5 border-t border-border/20 group/product"
        >
          {review.products.image_url && (
            <img
              src={review.products.image_url}
              alt={review.products.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-md object-cover flex-shrink-0"
              loading="lazy"
              decoding="async"
            />
          )}
          <span className="text-[11px] text-muted-foreground truncate group-hover/product:text-primary transition-colors">
            {review.products.name}
          </span>
        </a>
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
        .select("id, customer_name, rating, comment, created_at, products(name, slug, image_url)")
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
    <section className="py-6 sm:py-8 md:py-12 lg:py-14 section-container" aria-label="Customer Reviews" style={{ contain: "layout style" }}>
      <div className="flex flex-col items-center gap-1.5 mb-6 md:mb-8 md:flex-row md:justify-between">
        <div className="hidden md:block md:flex-1" />
        <h2 className="section-heading font-display font-semibold text-foreground text-center">
          Customer Reviews
        </h2>
        <div className="md:flex-1 flex md:justify-end">
          <a href="/reviews" className="text-xs md:text-sm font-medium text-primary hover:underline transition-colors">
            Show All Reviews
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 min-h-[200px]">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3 -mx-4 px-4 md:hidden"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          <div className="hidden md:block relative">
            <div className="grid grid-cols-4 gap-4">
              {desktopReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {totalDesktopPages > 1 && (
              <>
                <button
                  onClick={goDesktopPrev}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border/50 shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goDesktopNext}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border/50 shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Next reviews"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {totalDesktopPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
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
