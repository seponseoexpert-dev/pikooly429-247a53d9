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
import { Calendar, Users, MapPin, Phone, Mail, Star, Check, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
      toast.error("অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন");
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
      toast.success("বুকিং সফল হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setShowBookingForm(false);
      setFormData({ customer_name: "", customer_email: "", customer_phone: "", event_date: "", event_time: "", venue_address: "", guest_count: "", special_requests: "" });
    } catch (err: any) {
      toast.error("বুকিং করতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "EventPlanning",
    name: "Pikooly Event Management",
    description: "Professional event management services in Bangladesh - Wedding, Birthday, Corporate events",
    url: `${window.location.origin}/events`,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    serviceType: categories.map((c: any) => c.name),
  }), [categories]);

  return (
    <main className="min-h-screen">
      <SEOHead
        title="Event Management Services | Pikooly - বিয়ে, জন্মদিন, কর্পোরেট ইভেন্ট"
        description="Professional event management services in Bangladesh. Wedding decoration, birthday parties, corporate events. Book your event today with Pikooly."
        canonical={`${window.location.origin}/events`}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> Event Management
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              আপনার বিশেষ মুহূর্তকে <span className="text-primary">স্মরণীয়</span> করুন
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              বিয়ে, জন্মদিন, কর্পোরেট ইভেন্ট — সব ধরনের ইভেন্ট ম্যানেজমেন্ট সার্ভিস
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-10 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">আমাদের সার্ভিস সমূহ</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat: any, i: number) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`relative rounded-2xl overflow-hidden group cursor-pointer border-2 transition-all ${
                    selectedCategory === cat.id ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
                  }`}
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-32 md:h-44 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-32 md:h-44 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-end p-3">
                    <span className="text-white font-semibold text-sm md:text-base">{cat.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Packages */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">প্যাকেজ সমূহ</h2>
          <p className="text-center text-muted-foreground mb-8">আপনার বাজেট অনুযায়ী প্যাকেজ বেছে নিন</p>

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
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative bg-card rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                      pkg.is_featured ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    {pkg.is_featured && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" /> Popular
                      </div>
                    )}
                    {pkg.image_url && (
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-48 object-cover" loading="lazy" />
                    )}
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground mb-1">{(pkg as any).event_categories?.name}</p>
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

                      <Button onClick={() => handleBookNow(pkg.id)} className="w-full gap-2">
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
        <section id="booking-form" className="py-10 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl font-bold text-center text-foreground mb-6">ইভেন্ট বুকিং ফর্ম</h2>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">আপনার নাম *</label>
                  <Input value={formData.customer_name} onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))} placeholder="Full Name" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ফোন নম্বর *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" value={formData.customer_phone} onChange={e => setFormData(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+880XXXXXXXXXX" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ইমেইল</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="email" value={formData.customer_email} onChange={e => setFormData(p => ({ ...p, customer_email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ইভেন্টের তারিখ *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="date" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ইভেন্টের সময়</label>
                  <Input type="time" value={formData.event_time} onChange={e => setFormData(p => ({ ...p, event_time: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">অতিথি সংখ্যা</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" type="number" value={formData.guest_count} onChange={e => setFormData(p => ({ ...p, guest_count: e.target.value }))} placeholder="100" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">ভেন্যু ঠিকানা *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea className="pl-9" value={formData.venue_address} onChange={e => setFormData(p => ({ ...p, venue_address: e.target.value }))} placeholder="Event venue address" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">বিশেষ অনুরোধ</label>
                <Textarea value={formData.special_requests} onChange={e => setFormData(p => ({ ...p, special_requests: e.target.value }))} placeholder="আপনার বিশেষ কোনো চাহিদা থাকলে লিখুন..." />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "বুকিং হচ্ছে..." : "বুকিং কনফার্ম করুন"}
              </Button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
};

export default Events;
