import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">Blog</h1>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No blog posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post: any, i: number) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all"
            >
              <Link to={`/blog/${post.slug}`}>
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar size={12} />
                    <time>{new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                  </div>
                  <h2 className="font-display font-semibold text-lg group-hover:text-primary transition-colors mb-2">{post.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 group-hover:gap-2 transition-all">
                    Read More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Blog;
