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

      {/* Mobile: horizontal carousel */}
      <div className="relative md:hidden">
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[44vw] max-w-[200px] snap-start flex-shrink-0">
                  <BlogCardSkeleton />
                </div>
              ))
            : posts.map((post: any) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="w-[44vw] max-w-[200px] snap-start flex-shrink-0 group bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                      {post.category && (
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium text-[10px]">{post.category}</span>
                      )}
                      <Calendar size={10} />
                      <time>{new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                    </div>
                    <h3 className="font-display text-xs font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-snug">{post.title}</h3>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* Desktop: proper grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <BlogCardSkeleton key={i} />)
          : posts.slice(0, 3).map((post: any) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    {post.category && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium text-[11px]">{post.category}</span>
                    )}
                    <Calendar size={12} />
                    <time>{new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                  </div>
                  <h3 className="font-display text-base font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default BlogSection;
