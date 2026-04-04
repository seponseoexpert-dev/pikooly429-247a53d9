import { useParams, Link } from "react-router-dom";
import { Calendar, ArrowLeft, Clock, Share2, Facebook, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";
import { motion } from "framer-motion";

const BlogDetail = () => {
  const { slug } = useParams();
  const { settings } = useSiteSettings();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["related-blogs", post?.category, post?.id],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select("id, title, slug, image_url, published_at, created_at, category, excerpt")
        .eq("is_published", true)
        .neq("id", post!.id)
        .order("published_at", { ascending: false })
        .limit(3);
      if (post?.category) {
        query = query.eq("category", post.category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!post,
  });

  const siteName = settings.site_title || "Pikooly";
  const siteUrl = window.location.origin;
  const seoTitle = post ? (post.seo_title || `${post.title} - ${siteName}`) : siteName;
  const seoDesc = post ? (post.seo_description || post.excerpt || "") : "";

  const estimateReadTime = (content: string | null) => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  };

  const articleJsonLd = useMemo(() => {
    if (!post) return undefined;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || "",
          image: post.image_url || "",
          url: `${siteUrl}/blog/${post.slug}`,
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at,
          publisher: { "@type": "Organization", name: siteName },
          author: { "@type": "Organization", name: siteName },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
          ],
        },
      ],
    };
  }, [post, siteName, siteUrl]);

  if (isLoading) {
    return (
      <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="section-container py-20 text-center pb-24 md:pb-10">
        <p className="text-muted-foreground mb-4">Blog post not found.</p>
        <Link to="/blog" className="text-primary text-sm font-medium hover:underline">
          ← Back to Blog
        </Link>
      </main>
    );
  }

  const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const shareUrl = `${siteUrl}/blog/${post.slug}`;
  const shareLinks = [
    { label: "Facebook", icon: "F", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { label: "Twitter", icon: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}` },
    { label: "WhatsApp", icon: "W", href: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
    { label: "LinkedIn", icon: "in", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <main className="pb-24 md:pb-10">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={shareUrl}
        ogImage={post.image_url || ""}
        ogType="article"
        jsonLd={articleJsonLd}
      />

      {/* Hero Image */}
      {post.image_url && (
        <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] md:aspect-[21/8] overflow-hidden bg-muted">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 section-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {post.category && (
                <span className="inline-block bg-primary text-primary-foreground text-[10px] sm:text-xs px-3 py-1 rounded-full font-semibold mb-2 sm:mb-3">
                  {post.category}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight max-w-3xl">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-3 text-white/80 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <time>{publishedDate}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {estimateReadTime(post.content)}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <article className="section-container">
        <div className="max-w-3xl mx-auto py-6 sm:py-8 md:py-10">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
          >
            <ArrowLeft size={14} />
            Back to Blog
          </Link>

          {/* Title (shown if no image) */}
          {!post.image_url && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-3">
                {post.category && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{post.category}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <time>{publishedDate}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {estimateReadTime(post.content)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight mb-6">
                {post.title}
              </h1>
            </>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="bg-primary/5 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 border-l-4 border-primary">
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
            prose-headings:font-display prose-headings:text-foreground prose-headings:font-semibold
            prose-p:text-muted-foreground prose-p:leading-[1.8]
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-li:text-muted-foreground
            prose-strong:text-foreground
            rich-text-content"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          {/* Share Section */}
          <div className="mt-10 sm:mt-14 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Share2 size={16} /> Share this article
              </p>
              <div className="flex items-center gap-2">
                {shareLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-muted-foreground transition-all duration-200 text-xs font-bold"
                    aria-label={`Share on ${s.label}`}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/30 py-8 md:py-12">
          <div className="section-container">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-5">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {relatedPosts.map((rp: any) => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.slug}`}
                  className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={rp.image_url || "/placeholder.svg"}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                      {rp.category && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{rp.category}</span>
                      )}
                      <time>{new Date(rp.published_at || rp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                    </div>
                    <h3 className="font-display font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {rp.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default BlogDetail;
