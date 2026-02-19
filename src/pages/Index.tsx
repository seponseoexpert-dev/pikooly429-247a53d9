import HeroSection from "@/components/home/HeroSection";
import FeaturesBar from "@/components/home/FeaturesBar";
import ProductGrid from "@/components/home/ProductGrid";
import BlogSection from "@/components/home/BlogSection";
import AboutSection from "@/components/home/AboutSection";
import FAQSection from "@/components/home/FAQSection";

const Index = () => {
  return (
    <main>
      <HeroSection />
      <FeaturesBar />
      <ProductGrid />
      <AboutSection />
      <BlogSection />
      <FAQSection />
    </main>
  );
};

export default Index;