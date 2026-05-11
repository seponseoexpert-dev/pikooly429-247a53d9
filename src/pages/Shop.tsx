import { useState, useMemo, useEffect, useRef, useTransition, lazy, Suspense } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SEOHead from "@/components/seo/SEOHead";

const ShopFaqAccordion = lazy(() => import("@/components/shop/ShopFaqAccordion"));

const normalizeSearchText = (value: string | null | undefined) =>
  (value || "")
    .replace(/&amp;|&#38;|&#038;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff&\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesProductSearch = (product: any, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchParts = [
    product.name,
    product.short_description,
    product.description,
    product.categories?.name,
    ...(product.product_categories?.map((item: any) => item.categories?.name).filter(Boolean) || []),
    ...(product.product_subcategories?.map((item: any) => item.subcategories?.name).filter(Boolean) || []),
    ...(Array.isArray(product.tags) ? product.tags : []),
  ];

  return normalizeSearchText(searchParts.join(" ")).includes(normalizedQuery);
};

const Shop = () => {
  const { catSlug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const catParam = catSlug || searchParams.get("cat") || "";
  const subParam = subSlug || searchParams.get("sub") || "";
  const searchParam = searchParams.get("search") || "";
  const sameDayParam = searchParams.get("same_day") === "true";
  const [selectedCat, setSelectedCat] = useState(catParam);
  const [selectedSub, setSelectedSub] = useState(subParam);
  const [resolvedAsSub, setResolvedAsSub] = useState(false);
  const [shortDescExpanded, setShortDescExpanded] = useState(false);
  const [longDescExpanded, setLongDescExpanded] = useState(false);
  const shortDescRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const [sortBy, setSortBy] = useState("newest");

  const { data: products = [], isLoading: productsLoading, isFetching } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, image_url, rating, review_count, stock, is_featured, is_active, delivery_time, same_day_districts, next_day_districts, short_description, tags, category_id, subcategory_id, created_at, categories(name, slug), subcategories(name, slug), product_categories(category_id, categories(name, slug)), product_subcategories(subcategory_id, subcategories(name, slug))")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, description, short_description, long_description, seo_title, faq, display_order, category_type, category_types, show_in_header, show_in_homepage")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["shop-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, slug, category_id, image_url, description, short_description, long_description, seo_title, faq, display_order, show_in_tailored")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (catParam && !subParam && categories.length > 0 && subcategories.length > 0) {
      const matchedCat = categories.find((c: any) => c.slug === catParam);
      if (!matchedCat) {
        const matchedSub = subcategories.find((s: any) => s.slug === catParam);
        if (matchedSub) {
          const parentCat = categories.find((c: any) => c.id === matchedSub.category_id);
          if (parentCat) {
            setSelectedCat(parentCat.slug);
            setSelectedSub(matchedSub.slug);
            setResolvedAsSub(true);
            return;
          }
        }
      }
    }
    setSelectedCat(catParam);
    setSelectedSub(subParam);
    setResolvedAsSub(false);
    setShortDescExpanded(false);
  }, [catParam, subParam, categories, subcategories]);

  const activeCategory = useMemo(() => {
    if (!selectedCat) return null;
    return categories.find((c: any) => c.slug === selectedCat) || null;
  }, [selectedCat, categories]);

  const activeSubs = useMemo(() => {
    if (!activeCategory) return [];
    return subcategories.filter((s: any) => s.category_id === activeCategory.id);
  }, [activeCategory, subcategories]);

  useEffect(() => {
    setShortDescExpanded(false);
    setTimeout(() => {
      if (shortDescRef.current) {
        setNeedsTruncation(shortDescRef.current.scrollHeight > 72);
      }
    }, 100);
  }, [activeCategory, selectedSub]);

  const activeSubcategory = useMemo(() => {
    if (!selectedSub) return null;
    return subcategories.find((s: any) => s.slug === selectedSub) || null;
  }, [selectedSub, subcategories]);

  const activeContent = activeSubcategory || activeCategory;
  const activeCategoryName = activeSubcategory?.name || activeCategory?.name || (sameDayParam ? "Same Day Delivery" : "All Products");
  const { settings } = useSiteSettings();

  useEffect(() => {
    const siteName = settings.site_title || "Pikooly";
    const siteUrl = window.location.origin;
    const contentName = (activeContent as any)?.name;
    const seoTitle = (activeContent as any)?.seo_title;
    const metaDesc = (activeContent as any)?.description || (activeContent as any)?.short_description || "";

    document.title = seoTitle || (contentName ? `${contentName} - ${siteName}` : `Shop - ${siteName}`);

    let metaTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }
    metaTag.content = metaDesc || `Shop ${contentName || "all products"} at ${siteName}`;

    ["faq-schema-jsonld", "breadcrumb-schema-jsonld"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    const faqs = (activeContent as any)?.faq;
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

    const breadcrumbItems: any[] = [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    ];
    if (activeCategory) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: activeCategory.name,
        item: `${siteUrl}/product-category/${activeCategory.slug}`,
      });
      if (activeSubcategory) {
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 3,
          name: activeSubcategory.name,
          item: `${siteUrl}/product-category/${activeSubcategory.slug}`,
        });
      }
    } else {
      breadcrumbItems.push({ "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` });
    }
    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.id = "breadcrumb-schema-jsonld";
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    });
    document.head.appendChild(breadcrumbScript);

    return () => {
      document.title = siteName;
      ["faq-schema-jsonld", "breadcrumb-schema-jsonld"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [activeContent, activeCategory, activeSubcategory, settings]);

  const filtered = useMemo(() => {
    let list = selectedCat
      ? products.filter((p: any) => {
          if (p.categories?.slug === selectedCat) return true;
          if (p.product_categories?.some((pc: any) => pc.categories?.slug === selectedCat)) return true;
          return false;
        })
      : products;

    if (searchParam) {
      list = list.filter((p: any) => matchesProductSearch(p, searchParam));
    }

    if (selectedSub) {
      const sub = subcategories.find((s: any) => s.slug === selectedSub);
      if (sub) {
        list = list.filter((p: any) => 
          (p as any).subcategory_id === sub.id ||
          (p as any).product_subcategories?.some((psc: any) => psc.subcategory_id === sub.id)
        );
      }
    }

    if (sameDayParam) {
      list = list.filter((p: any) => {
        const dt = (p.delivery_time || "").toLowerCase();
        const hasSameDayText = /\b(same\s*day|today|express|instant|urgent|asap|min|mins|minute|hour|hr|hrs|h)\b/.test(dt) || /\d+\s*(m|h)\b/.test(dt);
        const hasSameDayDistricts = Array.isArray((p as any).same_day_districts) && (p as any).same_day_districts.length > 0;
        return hasSameDayText || hasSameDayDistricts;
      });
    }

    switch (sortBy) {
      case "price-low": return [...list].sort((a: any, b: any) => a.price - b.price);
      case "price-high": return [...list].sort((a: any, b: any) => b.price - a.price);
      case "rating": return [...list].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      default: return list;
    }
  }, [selectedCat, selectedSub, searchParam, sameDayParam, sortBy, products, subcategories]);

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 pb-24 md:pb-10">
      <SEOHead
        title={`${activeCategoryName || "Shop"} — Pikooly`}
        description={`Shop ${activeCategoryName || "premium flowers, gifts and cakes"} online at Pikooly. Same-day delivery across Bangladesh.`}
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
      />
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5 md:mb-6">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground shrink-0">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="font-semibold text-foreground line-clamp-1">{activeCategoryName}</span>
        </nav>
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none text-[11px] sm:text-sm bg-card border border-border rounded-lg px-3 py-2 pr-7 sm:px-4 sm:py-2.5 sm:pr-9 sm:w-[200px] md:w-[220px] outline-none text-foreground cursor-pointer shadow-sm hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          >
            <option value="newest">Default sorting</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <svg className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {activeContent && (activeContent as any).short_description && (
        <div className="mb-6 max-w-none">
          <div
            ref={shortDescRef}
            className={`prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-display prose-headings:text-base prose-headings:md:text-xl prose-headings:lg:text-2xl prose-headings:mb-1 prose-p:text-muted-foreground prose-p:text-xs prose-p:md:text-sm prose-p:leading-relaxed prose-p:mt-0 overflow-hidden transition-all duration-300 ${!shortDescExpanded ? "[&_p]:line-clamp-3" : ""}`}
            dangerouslySetInnerHTML={{ __html: (activeContent as any).short_description }}
          />
          <button
            onClick={() => setShortDescExpanded(!shortDescExpanded)}
            className="text-primary text-sm font-medium mt-2 hover:underline"
          >
            {shortDescExpanded ? "Read Less" : "Read More..."}
          </button>
        </div>
      )}

      {!catParam && !sameDayParam && (
        <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
          <button
            onClick={() => setSelectedCat("")}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[11px] sm:text-xs md:text-sm font-medium transition-all snap-start ${!selectedCat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.slug)}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[11px] sm:text-xs md:text-sm font-medium transition-all snap-start ${selectedCat === cat.slug ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-5">
        {productsLoading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : filtered.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!productsLoading && filtered.length === 0 && (
        <div className="text-center py-16 sm:py-20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingCart size={24} className="text-muted-foreground/50" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {searchParam ? `No products found for "${searchParam}".` : "No products found in this category."}
          </p>
        </div>
      )}

      {activeContent && (activeContent as any).long_description && (
        <div className="mt-10">
          <div
            className={`prose prose-sm dark:prose-invert max-w-none text-muted-foreground overflow-hidden transition-all duration-300 ${!longDescExpanded ? "line-clamp-5" : ""}`}
            dangerouslySetInnerHTML={{ __html: (activeContent as any).long_description }}
          />
          <button
            onClick={() => setLongDescExpanded(!longDescExpanded)}
            className="text-primary text-sm font-medium mt-2 hover:underline"
          >
            {longDescExpanded ? "Read Less" : "Read More..."}
          </button>
        </div>
      )}

      {activeContent && Array.isArray((activeContent as any).faq) && (activeContent as any).faq.length > 0 && (
        <Suspense fallback={<div className="mt-14 mb-8 h-32" />}>
          <ShopFaqAccordion faqs={(activeContent as any).faq} contentName={(activeContent as any)?.name} />
        </Suspense>
      )}
    </main>
  );
};

export default Shop;
