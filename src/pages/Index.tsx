import { useEffect } from "react";
import HeroSection from "@/components/home/HeroSection";
import FeaturesBar from "@/components/home/FeaturesBar";
import SocialProofSection from "@/components/home/SocialProofSection";
import BlogSection from "@/components/home/BlogSection";
import CustomerReviewSection from "@/components/home/CustomerReviewSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductGrid from "@/components/home/ProductGrid";
import AboutSection from "@/components/home/AboutSection";
import FAQSection from "@/components/home/FAQSection";
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
      // Reset title when leaving homepage
      const fallback = settings.site_title || settings.store_name;
      if (fallback) document.title = fallback;
    };
  }, [settings]);

  return (
    <main>
      <HeroSection />
      <FeaturesBar />
      <SocialProofSection />
      <CategoryGrid />
      <ProductGrid />
      <BlogSection />
      <CustomerReviewSection />
      <AboutSection />
      <FAQSection />
    </main>
  );
};

export default Index;
