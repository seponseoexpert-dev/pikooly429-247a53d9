import { useEffect } from "react";
import HeroSection from "@/components/home/HeroSection";
import FeaturesBar from "@/components/home/FeaturesBar";
import BlogSection from "@/components/home/BlogSection";
import CustomerReviewSection from "@/components/home/CustomerReviewSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductGrid from "@/components/home/ProductGrid";
import AboutSection from "@/components/home/AboutSection";
import FAQSection from "@/components/home/FAQSection";
import OfferBanners from "@/components/home/OfferBanners";
import RelationshipGrid from "@/components/home/RelationshipGrid";
import GiftingStories from "@/components/home/GiftingStories";
import CelebrationsCalendar from "@/components/home/CelebrationsCalendar";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
      <FeaturesBar />
      <CategoryGrid />
      <OfferBanners />
      <RelationshipGrid />
      <ProductGrid />
      <CelebrationsCalendar />
      <GiftingStories />
      <BlogSection />
      <CustomerReviewSection />
      <AboutSection />
      <FAQSection />
    </main>
  );
};

export default Index;
