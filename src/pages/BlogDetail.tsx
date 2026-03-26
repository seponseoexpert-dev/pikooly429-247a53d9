import { useParams, Link } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";

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

  useEffect(() => {
    if (!post) return;
    const siteName = settings.site_title || "Pikooly";
    document.title = post.seo_title || `${post.title} - ${siteName}`;

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.seo_description || post.excerpt || "";

    return () => {
      document.title = siteName;
    };
  }, [post, settings]);

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

  return (
    <main className="pb-24 md:pb-10">
      {/* Hero Image */}
      {post.image_url && (
        <div className="w-full aspect-[16/7] sm:aspect-[16/6] md:aspect-[16/5] overflow-hidden bg-muted">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      <article className="section-container py-6 sm:py-8 md:py-10">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          {post.category && (
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
              {post.category}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            <time>{publishedDate}</time>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight mb-6 sm:mb-8">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 border-l-4 border-primary/30 pl-4 italic">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
          prose-headings:font-display prose-headings:text-foreground prose-headings:font-semibold
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:shadow-md
          prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
          prose-li:text-muted-foreground
          prose-strong:text-foreground
          rich-text-content"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {/* Share */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">Share this article:</p>
          <div className="flex items-center gap-2">
            {[
              { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
              { label: "Twitter", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}` },
              { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}` },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors text-xs font-bold"
                aria-label={`Share on ${s.label}`}
              >
                {s.label[0]}
              </a>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
};

export default BlogDetail;
