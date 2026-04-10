import { useEffect, lazy, Suspense, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductGrid from "@/components/home/ProductGrid";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";

// Lazy load all below-fold sections
const OfferBanners = lazy(() => import("@/components/home/OfferBanners"));
const RelationshipGrid = lazy(() => import("@/components/home/RelationshipGrid"));
const CelebrationsCalendar = lazy(() => import("@/components/home/CelebrationsCalendar"));
const GiftingStories = lazy(() => import("@/components/home/GiftingStories"));
const EventsSection = lazy(() => import("@/components/home/EventsSection"));
const BlogSection = lazy(() => import("@/components/home/BlogSection"));
const CustomerReviewSection = lazy(() => import("@/components/home/CustomerReviewSection"));
const AboutSection = lazy(() => import("@/components/home/AboutSection"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));

const LazyFallback = () => <div className="min-h-[100px]" />;

const Index = () => {
  const queryClient = useQueryClient();
  const { settings } = useSiteSettings();

  // Prefetch shop data so it's cached when user navigates to Shop page
  useEffect(() => {
    // Defer shop prefetch until user is idle (not blocking initial render)
    const idleId = "requestIdleCallback" in window
      ? (window as any).requestIdleCallback(() => {
          queryClient.prefetchQuery({
            queryKey: ["shop-products"],
            queryFn: async () => {
              const { data } = await supabase.from("products").select("*, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)").eq("is_active", true).order("created_at", { ascending: false });
              return data;
            },
          });
        }, { timeout: 5000 })
      : window.setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey: ["shop-products"],
            queryFn: async () => {
              const { data } = await supabase.from("products").select("*, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)").eq("is_active", true).order("created_at", { ascending: false });
              return data;
            },
          });
        }, 4000);

    return () => {
      if ("requestIdleCallback" in window) (window as any).cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [queryClient]);

  const seoTitle = settings.homepage_seo_title || settings.site_title || "Pikooly";
  const seoDesc = settings.homepage_meta_description || "Fresh flowers, gifts, and cakes delivered across Bangladesh.";
  const siteName = settings.store_name || settings.site_title || "Pikooly";
  const siteUrl = window.location.origin;

  const combinedJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        description: seoDesc,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/shop?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: siteName,
        url: siteUrl,
        logo: settings.company_logo || "",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: settings.contact_phone || "",
          contactType: "customer service",
        },
        sameAs: [
          settings.social_facebook || "",
          settings.social_instagram || "",
        ].filter(Boolean),
      },
    ],
  }), [siteName, siteUrl, seoDesc, settings]);

  return (
    <main>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={siteUrl}
        ogImage={settings.og_image || ""}
        jsonLd={combinedJsonLd}
      />
      <HeroSection />
      <CategoryGrid />
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <OfferBanners />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <RelationshipGrid />
        </Suspense>
      </div>
      <ProductGrid />
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <CelebrationsCalendar />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <GiftingStories />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <EventsSection />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <BlogSection />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <CustomerReviewSection />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <AboutSection />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <FAQSection />
        </Suspense>
      </div>
    </main>
  );
};

export default Index;
