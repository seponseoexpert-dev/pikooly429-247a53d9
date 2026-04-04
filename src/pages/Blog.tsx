import { useState, useMemo } from "react";
import { Calendar, ArrowRight, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogCardSkeleton } from "@/components/ui/skeletons";
import SEOHead from "@/components/seo/SEOHead";

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("");

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

  const categories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((p: any) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((p: any) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  const featuredPost = filtered[0];
  const restPosts = filtered.slice(1);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const estimateReadTime = (content: string | null) => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  };

  return (
    <main className="pb-24 md:pb-10">
      <SEOHead
        title="Blog — Pikooly"
        description="Read our latest blog posts about flowers, gifts, celebrations, and gifting tips in Bangladesh."
        canonical={`${window.location.origin}/blog`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Pikooly Blog",
          url: `${window.location.origin}/blog`,
          description: "Latest articles about flowers, gifts, and celebrations in Bangladesh.",
        }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-6 pb-8 md:pt-10 md:pb-12">
        <div className="section-container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-2"
          >
            Our Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base max-w-lg"
          >
            Stories, tips, and inspiration for every celebration
          </motion.p>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 overflow-x-auto mt-5 scrollbar-hide"
            >
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${!selectedCategory ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-card text-muted-foreground hover:bg-accent border border-border/50"}`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === cat ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-card text-muted-foreground hover:bg-accent border border-border/50"}`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="section-container py-6 md:py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => <BlogCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No blog posts yet.</p>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 md:mb-12"
              >
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="group grid md:grid-cols-2 gap-0 md:gap-6 bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
                    <img
                      src={featuredPost.image_url || "/placeholder.svg"}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                    />
                  </div>
                  <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-semibold mb-2">Featured</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                      {featuredPost.category && (
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{featuredPost.category}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        <time>{formatDate(featuredPost.published_at || featuredPost.created_at)}</time>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {estimateReadTime(featuredPost.content)}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-foreground group-hover:text-primary transition-colors mb-3 leading-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 mb-4">{featuredPost.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold group-hover:gap-3 transition-all">
                      Read Article <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.article>
            )}

            {/* Rest Posts Grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {restPosts.map((post: any, i: number) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <Link to={`/blog/${post.slug}`} className="flex flex-col flex-1">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        {post.category && (
                          <span className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-primary text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium">
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            <time>{formatDate(post.published_at || post.created_at)}</time>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {estimateReadTime(post.content)}
                          </span>
                        </div>
                        <h2 className="font-display font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2 leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{post.excerpt}</p>
                        <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 group-hover:gap-2 transition-all">
                          Read More <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Blog;
