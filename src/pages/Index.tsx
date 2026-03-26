import { useEffect, lazy, Suspense, useMemo } from "react";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductGrid from "@/components/home/ProductGrid";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";

// Lazy load all below-fold sections
const OfferBanners = lazy(() => import("@/components/home/OfferBanners"));
const RelationshipGrid = lazy(() => import("@/components/home/RelationshipGrid"));
const CelebrationsCalendar = lazy(() => import("@/components/home/CelebrationsCalendar"));
const GiftingStories = lazy(() => import("@/components/home/GiftingStories"));
const BlogSection = lazy(() => import("@/components/home/BlogSection"));
const CustomerReviewSection = lazy(() => import("@/components/home/CustomerReviewSection"));
const AboutSection = lazy(() => import("@/components/home/AboutSection"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));

const LazyFallback = () => <div className="min-h-[100px]" />;

const Index = () => {
  const { settings } = useSiteSettings();

  const seoTitle = settings.homepage_seo_title || settings.site_title || "Pikooly — Online Flower, Gift & Cake Shop in Bangladesh";
  const seoDesc = settings.homepage_meta_description || "Order fresh flowers, beautiful gifts, and delicious cakes online in Bangladesh. Same day delivery in Dhaka.";
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
      <Suspense fallback={<LazyFallback />}>
        <OfferBanners />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <RelationshipGrid />
      </Suspense>
      <ProductGrid />
      <Suspense fallback={<LazyFallback />}>
        <CelebrationsCalendar />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <GiftingStories />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <BlogSection />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <CustomerReviewSection />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
        <FAQSection />
      </Suspense>
    </main>
  );
};

export default Index;
