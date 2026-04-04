import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const EventCategoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { formatPrice } = useMultiCurrency();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["event-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["event-category-packages", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_packages")
        .select("*")
        .eq("category_id", category!.id)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  const seoTitle = category?.seo_title || `${category?.name || "Event"} | Pikooly`;
  const seoDesc = category?.seo_description || category?.short_description || `${category?.name} event management services by Pikooly Bangladesh.`;
  const canonical = `${window.location.origin}/events/${slug}`;

  const jsonLd = useMemo(() => {
    if (!category) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: category.name,
      description: seoDesc,
      url: canonical,
      provider: {
        "@type": "Organization",
        name: "Pikooly",
        url: window.location.origin,
      },
      areaServed: { "@type": "Country", name: "Bangladesh" },
      ...(packages.length > 0 && {
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${category.name} Packages`,
          itemListElement: packages.map((pkg: any, i: number) => ({
            "@type": "Offer",
            position: i + 1,
            name: pkg.name,
            price: pkg.price,
            priceCurrency: "BDT",
          })),
        },
      }),
    };
  }, [category, packages, seoDesc, canonical]);

  if (catLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Category not found</p>
        <Link to="/events"><Button variant="outline">← View All Events</Button></Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SEOHead
        title={seoTitle.slice(0, 55)}
        description={seoDesc.slice(0, 160)}
        canonical={canonical}
        ogImage={category.image_url || ""}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> সব ইভেন্ট
          </Link>
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
            {category.image_url && (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={category.image_url}
                alt={category.name}
                className="w-full md:w-1/3 max-h-64 object-cover rounded-2xl shadow-lg"
                loading="eager"
              />
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Event Service
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">{category.name}</h1>
              {category.short_description && (
                <p className="text-muted-foreground text-base md:text-lg max-w-xl">{category.short_description}</p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Long Description */}
      {category.long_description && (
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div
              className="rich-text-content prose prose-sm md:prose-base max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: category.long_description }}
            />
          </div>
        </section>
      )}

      {/* Packages */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-center text-foreground mb-2">প্যাকেজ সমূহ</h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">আপনার বাজেট অনুযায়ী প্যাকেজ বেছে নিন</p>

          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">এই ক্যাটাগরিতে এখনো কোনো প্যাকেজ যোগ করা হয়নি</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg: any, i: number) => {
                const features = Array.isArray(pkg.features) ? pkg.features : [];
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative bg-card rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                      pkg.is_featured ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    {pkg.is_featured && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 z-10">
                        <Star className="w-3 h-3" /> Popular
                      </div>
                    )}
                    {pkg.image_url && (
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-48 object-cover" loading="lazy" />
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-foreground mb-2">{pkg.name}</h3>
                      {pkg.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pkg.description}</p>}

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</span>
                        {pkg.original_price && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(pkg.original_price)}</span>
                        )}
                      </div>

                      {features.length > 0 && (
                        <ul className="space-y-2 mb-5">
                          {features.map((f: any, fi: number) => (
                            <li key={fi} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{typeof f === "string" ? f : f.text || f.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Link to={`/events?book=${pkg.id}`}>
                        <Button className="w-full gap-2">
                          Book Now <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default EventCategoryDetail;
