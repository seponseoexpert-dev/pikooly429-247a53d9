import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Shop = () => {
  const { catSlug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const catParam = catSlug || searchParams.get("cat") || "";
  const subParam = subSlug || searchParams.get("sub") || "";
  const searchParam = searchParams.get("search") || "";
  const [selectedCat, setSelectedCat] = useState(catParam);
  const [selectedSub, setSelectedSub] = useState(subParam);
  const [shortDescExpanded, setShortDescExpanded] = useState(false);
  const shortDescRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  useEffect(() => {
    setSelectedCat(catParam);
    setSelectedSub(subParam);
    setShortDescExpanded(false);
  }, [catParam, subParam]);

  const [sortBy, setSortBy] = useState("newest");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_categories(category_id, categories(name, slug))")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["shop-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const activeCategory = useMemo(() => {
    if (!selectedCat) return null;
    return categories.find((c: any) => c.slug === selectedCat) || null;
  }, [selectedCat, categories]);

  const activeSubs = useMemo(() => {
    if (!activeCategory) return [];
    return subcategories.filter((s: any) => s.category_id === activeCategory.id);
  }, [activeCategory, subcategories]);

  useEffect(() => {
    setTimeout(() => {
      if (shortDescRef.current) {
        setNeedsTruncation(shortDescRef.current.scrollHeight > 72);
      }
    }, 100);
  }, [activeCategory]);

  const activeCategoryName = activeCategory?.name || "All Products";
  const { settings } = useSiteSettings();

  useEffect(() => {
    const siteName = settings.site_title || "Pikooly";
    const catName = activeCategory?.name;
    const seoTitle = (activeCategory as any)?.seo_title;
    const metaDesc = activeCategory?.description || (activeCategory as any)?.short_description || "";

    document.title = seoTitle || (catName ? `${catName} - ${siteName}` : `Shop - ${siteName}`);

    let metaTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }
    metaTag.content = metaDesc || `Shop ${catName || "all products"} at ${siteName}`;

    const existingSchema = document.getElementById("faq-schema-jsonld");
    if (existingSchema) existingSchema.remove();

    const faqs = (activeCategory as any)?.faq;
    if (Array.isArray(faqs) && faqs.length > 0) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq: any) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      };
      const script = document.createElement("script");
      script.id = "faq-schema-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      document.title = siteName;
      const schemaTag = document.getElementById("faq-schema-jsonld");
      if (schemaTag) schemaTag.remove();
    };
  }, [activeCategory, settings]);

  const filtered = useMemo(() => {
    let list = selectedCat
      ? products.filter((p: any) => {
          // Check primary category
          if (p.categories?.slug === selectedCat) return true;
          // Check junction table categories
          if (p.product_categories?.some((pc: any) => pc.categories?.slug === selectedCat)) return true;
          return false;
        })
      : products;

    if (searchParam) {
      const q = searchParam.toLowerCase();
      list = list.filter((p: any) => p.name?.toLowerCase().includes(q));
    }

    if (selectedSub) {
      const sub = subcategories.find((s: any) => s.slug === selectedSub);
      if (sub) {
        list = list.filter((p: any) => (p as any).subcategory_id === sub.id);
      }
    }

    switch (sortBy) {
      case "price-low": return [...list].sort((a: any, b: any) => a.price - b.price);
      case "price-high": return [...list].sort((a: any, b: any) => b.price - a.price);
      case "rating": return [...list].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      default: return list;
    }
  }, [selectedCat, selectedSub, searchParam, sortBy, products, subcategories]);

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{activeCategoryName}</span>
        </nav>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs sm:text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none text-foreground cursor-pointer"
        >
          <option value="newest">Default sorting</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {activeCategory && (activeCategory as any).short_description && (
        <div className="mb-6 max-w-none">
          <div
            ref={shortDescRef}
            className={`prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-display prose-headings:text-base prose-headings:md:text-xl prose-headings:lg:text-2xl prose-headings:mb-1 prose-p:text-muted-foreground prose-p:text-xs prose-p:md:text-sm prose-p:leading-relaxed prose-p:mt-0 overflow-hidden transition-all duration-300 ${!shortDescExpanded ? "[&_p]:line-clamp-3" : ""}`}
            dangerouslySetInnerHTML={{ __html: (activeCategory as any).short_description }}
          />
          <button
            onClick={() => setShortDescExpanded(!shortDescExpanded)}
            className="text-primary text-sm font-medium mt-2 hover:underline"
          >
            {shortDescExpanded ? "Read Less" : "Read More..."}
          </button>
        </div>
      )}

      {!catParam && (
        <div className="flex gap-2 overflow-x-auto mb-5 md:mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedCat === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {selectedCat && activeSubs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-5 md:mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedSub("")}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${!selectedSub ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All {activeCategory?.name}
          </button>
          {activeSubs.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSub(sub.slug)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedSub === sub.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {productsLoading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : filtered.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!productsLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm sm:text-base md:text-lg">No products found in this category.</p>
        </div>
      )}

      {activeCategory && (activeCategory as any).long_description && (
        <div className="mt-10 prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: (activeCategory as any).long_description }} />
      )}

      {activeCategory && (() => {
        const faqs = (activeCategory as any).faq;
        if (!Array.isArray(faqs) || faqs.length === 0) return null;
        return (
          <div className="mt-14 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Find answers to common questions about {activeCategory?.name}</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqs.map((faq: any, i: number) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border border-border/60 rounded-xl px-5 bg-card shadow-sm data-[state=open]:shadow-md transition-shadow duration-200"
                  >
                    <AccordionTrigger className="text-sm md:text-base font-medium text-left text-foreground py-4 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        );
      })()}
    </main>
  );
};

export default Shop;
