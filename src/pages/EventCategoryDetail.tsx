import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Star, Sparkles, ArrowLeft, Phone, Mail, Calendar, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const EventCategoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { formatPrice } = useMultiCurrency();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{ name: string; pkgName: string; date: string } | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    event_date: "",
    event_time: "",
    venue_address: "",
    guest_count: "",
    special_requests: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.event_date || !formData.venue_address) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const pkg = packages.find((p: any) => p.id === selectedPackage);
      const { error } = await supabase.from("event_bookings").insert({
        booking_number: "temp",
        user_id: user?.id || null,
        package_id: selectedPackage,
        category_id: category?.id || null,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        venue_address: formData.venue_address,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
        special_requests: formData.special_requests || null,
        total: pkg?.price || 0,
      });
      if (error) throw error;
      toast.success("Booking confirmed! We will contact you shortly.");
      setShowBookingForm(false);
      setFormData({ customer_name: "", customer_email: "", customer_phone: "", event_date: "", event_time: "", venue_address: "", guest_count: "", special_requests: "" });
    } catch (err: any) {
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <ArrowLeft className="w-4 h-4" /> All Events
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
          <h2 className="text-xl md:text-2xl font-bold text-center text-foreground mb-2">Our Packages</h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">Choose a package that fits your budget</p>

          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No packages available in this category yet</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg: any, i: number) => {
                const features = Array.isArray(pkg.features) ? pkg.features : [];
                const discount = pkg.original_price ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100) : 0;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.25)] ${
                      pkg.is_featured ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border/60"
                    }`}
                  >
                    {/* Image with gradient overlay */}
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                      {pkg.image_url ? (
                        <>
                          <img src={pkg.image_url} alt={pkg.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-10 w-10 text-primary/30" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {pkg.is_featured && (
                          <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                            <Star className="w-3 h-3" /> Most Popular
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="inline-flex items-center bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-foreground mb-1.5">{pkg.name}</h3>
                      {pkg.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{pkg.description}</p>}

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-border/40">
                        <span className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</span>
                        {pkg.original_price && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(pkg.original_price)}</span>
                        )}
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <ul className="space-y-2.5 mb-5">
                          {features.map((f: any, fi: number) => (
                            <li key={fi} className="flex items-start gap-2.5 text-sm text-foreground">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Check className="w-3 h-3 text-primary" />
                              </span>
                              <span>{typeof f === "string" ? f : f.text || f.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        onClick={() => {
                          setSelectedPackage(pkg.id);
                          setShowBookingForm(true);
                          setTimeout(() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" }), 100);
                        }}
                        className="w-full gap-2 shadow-md hover:shadow-lg transition-shadow"
                      >
                        Book Now <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Booking Form */}
      {showBookingForm && (
        <section id="booking-form" className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-6">
              <span className="text-primary text-xs font-semibold tracking-wider uppercase">Almost There</span>
              <h2 className="text-2xl font-bold text-foreground mt-1">Event Booking Form</h2>
              {selectedPackage && (
                <p className="text-sm text-muted-foreground mt-1">
                  Package: {packages.find((p: any) => p.id === selectedPackage)?.name}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Your Name *</label>
                  <Input value={formData.customer_name} onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))} placeholder="Full Name" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" value={formData.customer_phone} onChange={e => setFormData(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+880XXXXXXXXXX" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="email" value={formData.customer_email} onChange={e => setFormData(p => ({ ...p, customer_email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Event Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="date" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Event Time</label>
                  <Input type="time" value={formData.event_time} onChange={e => setFormData(p => ({ ...p, event_time: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Guest Count</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="number" value={formData.guest_count} onChange={e => setFormData(p => ({ ...p, guest_count: e.target.value }))} placeholder="100" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Venue Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea className="pl-9" value={formData.venue_address} onChange={e => setFormData(p => ({ ...p, venue_address: e.target.value }))} placeholder="Event venue address" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Special Requests</label>
                <Textarea value={formData.special_requests} onChange={e => setFormData(p => ({ ...p, special_requests: e.target.value }))} placeholder="Any special requirements or requests..." />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
};

export default EventCategoryDetail;
