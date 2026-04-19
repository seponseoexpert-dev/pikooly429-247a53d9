import { useEffect, lazy, Suspense, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductGrid from "@/components/home/ProductGrid";
import TailoredOccasions from "@/components/home/TailoredOccasions";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import freeDeliveryBanner from "@/assets/free-delivery-banner.png";

// Lazy load all below-fold sections
const OfferBanners = lazy(() => import("@/components/home/OfferBanners"));
const PopularGifting = lazy(() => import("@/components/home/PopularGifting"));
const RelationshipGrid = lazy(() => import("@/components/home/RelationshipGrid"));
const CelebrationsCalendar = lazy(() => import("@/components/home/CelebrationsCalendar"));
const GiftingStories = lazy(() => import("@/components/home/GiftingStories"));
const HomeLivingGifts = lazy(() => import("@/components/home/HomeLivingGifts"));
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
    const prefetchShop = () => {
      queryClient.prefetchQuery({
        queryKey: ["shop-products"],
        queryFn: async () => {
          const { data } = await supabase.from("products").select("id, name, slug, price, original_price, image_url, rating, stock, is_featured, delivery_time, category_id, categories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id)").eq("is_active", true).order("created_at", { ascending: false }).limit(200);
          return data;
        },
      });
    };

    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(prefetchShop, { timeout: 8000 });
      return () => (window as any).cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(prefetchShop, 6000);
    return () => globalThis.clearTimeout(id);
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
      <section className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        <img
          src={freeDeliveryBanner}
          alt="Free delivery on eligible time slots"
          className="w-full h-auto rounded-xl sm:rounded-2xl object-cover"
          loading="eager"
        />
      </section>
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
      <TailoredOccasions />
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <CelebrationsCalendar />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <PopularGifting />
        </Suspense>
      </div>
      <div className="deferred-section">
        <Suspense fallback={<LazyFallback />}>
          <HomeLivingGifts />
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
