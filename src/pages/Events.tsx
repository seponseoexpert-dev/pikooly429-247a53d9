import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, MapPin, Phone, Mail, Star, Check, ArrowRight, Sparkles, PartyPopper, Heart, Briefcase, Gift, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  birthday: PartyPopper,
  wedding: Heart,
  corporate: Briefcase,
  anniversary: Gift,
};

const CATEGORY_GRADIENTS = [
  "from-primary/15 via-primary/5 to-transparent",
  "from-pink-500/15 via-pink-500/5 to-transparent",
  "from-blue-500/15 via-blue-500/5 to-transparent",
  "from-amber-500/15 via-amber-500/5 to-transparent",
];

const CATEGORY_BADGES = ["Most Booked", "Elegant Choice", "Corporate Ready", "Premium"];

const Events = () => {
  const { user } = useAuth();
  const { formatPrice } = useMultiCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
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

  const { data: categories = [] } = useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["event-packages", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("event_packages")
        .select("*, event_categories(name, slug)")
        .eq("is_active", true)
        .order("display_order");
      if (selectedCategory) query = query.eq("category_id", selectedCategory);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleBookNow = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setShowBookingForm(true);
    setTimeout(() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

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
        category_id: pkg?.category_id || selectedCategory || categories[0]?.id,
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

  const getIconForCategory = (slug: string, index: number): LucideIcon => {
    const key = Object.keys(CATEGORY_ICONS).find(k => slug?.toLowerCase().includes(k));
    if (key) return CATEGORY_ICONS[key];
    const fallbackIcons: LucideIcon[] = [PartyPopper, Heart, Briefcase, Gift];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "EventPlanning",
    name: "Pikooly Event Management",
    description: "Professional event management services in Bangladesh - Wedding, Birthday, Corporate events",
    url: `${window.location.origin}/events`,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    serviceType: categories.map((c: any) => c.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Event Packages",
      itemListElement: packages.slice(0, 4).map((pkg: any, i: number) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: pkg.name,
          description: pkg.description,
        },
        price: pkg.price,
        priceCurrency: "BDT",
        position: i + 1,
      })),
    },
  }), [categories, packages]);

  const faqJsonLd = useMemo(() => {
    const allFaqs = categories
      .filter((c: any) => c.name)
      .map((c: any) => ({
        "@type": "Question",
        name: `What does ${c.name} service include?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: c.short_description || c.description || `Professional ${c.name} event planning with décor, coordination and on-ground execution.`,
        },
      }));
    if (allFaqs.length === 0) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaqs,
    };
  }, [categories]);

  const breadcrumbJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
      { "@type": "ListItem", position: 2, name: "Events", item: `${window.location.origin}/events` },
    ],
  }), []);

  return (
    <main>
      <SEOHead
        title="Event Management Services | Pikooly"
        description="Professional event management services in Bangladesh. Wedding decoration, birthday parties, corporate events. Book your event today with Pikooly."
        canonical={`${window.location.origin}/events`}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-14 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> Event Management
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Make Your Special Moments <span className="text-primary">Unforgettable</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Wedding, birthday, corporate events — complete event management services tailored for you
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories — 4-card premium grid */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-10">
              <span className="text-primary text-xs font-semibold tracking-wider uppercase">What We Offer</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-1">Our Services</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {categories.slice(0, 4).map((cat: any, i: number) => {
                const Icon = getIconForCategory(cat.slug, i);
                const gradient = CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length];
                const badge = CATEGORY_BADGES[i % CATEGORY_BADGES.length];
                const isSelected = selectedCategory === cat.id;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <div
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isSelected ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      {/* Image / Gradient Panel */}
                      <div className={`relative min-h-[140px] md:min-h-[170px] overflow-hidden bg-gradient-to-br ${gradient}`}>
                        {cat.image_url ? (
                          <>
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              width={400}
                              height={300}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
                            <span className="absolute left-3 top-3 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground backdrop-blur-sm">
                              {badge}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-primary/10" />
                            <div className="absolute -bottom-10 left-[-14px] h-28 w-28 rounded-full bg-accent/10" />
                            <div className="relative flex h-full min-h-[140px] md:min-h-[170px] items-end justify-between p-4">
                              <span className="rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground backdrop-blur-sm">
                                {badge}
                              </span>
                              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/85 text-primary shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                                <Icon className="h-5 w-5" />
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-3.5 md:p-4">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="text-sm md:text-[15px] font-semibold text-foreground leading-snug">{cat.name}</p>
                            {cat.image_url && (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] md:text-xs leading-relaxed text-muted-foreground line-clamp-2 md:line-clamp-3">
                            {cat.short_description || cat.description || "Professional event planning with décor, coordination and on-ground execution."}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                          <span className="text-[11px] font-medium text-muted-foreground">Event planning</span>
                          <Link to={`/events/${cat.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Explore <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Packages */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">Choose Your Plan</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-1">Event Packages</h2>
            <p className="text-muted-foreground mt-2">Select a package that fits your budget and requirements</p>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No packages available for this category yet</p>
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

                      {/* Category badge bottom-right */}
                      <span className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border/40 z-10">
                        {(pkg as any).event_categories?.name}
                      </span>
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

                      <Button onClick={() => handleBookNow(pkg.id)} className="w-full gap-2 shadow-md hover:shadow-lg transition-shadow">
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

export default Events;
