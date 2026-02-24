import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogCardSkeleton } from "@/components/ui/skeletons";

const BlogSection = () => {
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

  if (!isLoading && posts.length === 0) return null;

  return (
    <section className="py-8 md:py-12 section-container">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-display font-semibold">Latest from Blog</h2>
        <Link to="/blog" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <BlogCardSkeleton />
              </div>
            ))
          : posts.map((post: any) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    {post.category && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-[11px]">
                        {post.category}
                      </span>
                    )}
                    <Calendar size={12} />
                    <time>
                      {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors mb-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default BlogSection;
