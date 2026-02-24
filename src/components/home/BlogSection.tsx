import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlogCardSkeleton } from "@/components/ui/skeletons";

const BlogSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["home-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  if (!isLoading && posts.length === 0) return null;

  return (
    <section className="py-8 md:py-12 section-container">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-display font-semibold">Latest from Blog</h2>
        <Link to="/blog" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative group/blog">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[calc(50%-6px)] sm:min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-11px)] md:max-w-[calc(33.333%-11px)] snap-start flex-shrink-0">
                  <BlogCardSkeleton />
                </div>
              ))
            : posts.map((post: any) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="min-w-[calc(50%-6px)] sm:min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-11px)] md:max-w-[calc(33.333%-11px)] snap-start flex-shrink-0 group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2">
                      {post.category && (
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium text-[10px] md:text-[11px]">
                          {post.category}
                        </span>
                      )}
                      <Calendar size={10} className="md:w-3 md:h-3" />
                      <time>
                        {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <h3 className="font-display text-sm md:text-base font-semibold group-hover:text-primary transition-colors mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
