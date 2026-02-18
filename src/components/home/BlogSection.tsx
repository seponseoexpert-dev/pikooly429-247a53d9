import { blogPosts } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const BlogSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 md:py-16 bg-muted/30" aria-label="Blog">
      <div className="section-container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Fresh Insights & Flower Stories
          </h2>
          <p className="text-muted-foreground">Tips, trends, and tales from our garden</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-400"
            >
              <Link to={`/blog/${post.id}`} className="block">
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar size={12} />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                    <span>•</span>
                    <span>{post.author}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 group-hover:gap-2 transition-all">
                    Read More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;