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

  useEffect(() => {
    const seoTitle = settings.homepage_seo_title;
    if (seoTitle) {
      document.title = seoTitle;
    }

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const descContent = settings.homepage_meta_description;
    if (descContent) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = descContent;
    }

    return () => {
      const fallback = settings.site_title || settings.store_name;
      if (fallback) document.title = fallback;
    };
  }, [settings]);

  return (
    <main>
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
