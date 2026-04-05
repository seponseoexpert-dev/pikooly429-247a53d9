import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import SEOHead from "@/components/seo/SEOHead";
import { Camera, Video, Gift, MapPin, Calendar, Package, User, ChevronRight, ChevronLeft, Play, Sparkles, Clock, CheckCircle2, Star, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const serviceIcons = [Camera, Video, Gift];

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
];

const Photography = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [locationType, setLocationType] = useState("dhaka");
  const [district, setDistrict] = useState("");
  const [eventDate, setEventDate] = useState<Date>();
  const [eventTime, setEventTime] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState("all");

  const { data: services } = useQuery({
    queryKey: ["photo-services"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_services").select("*").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["photo-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_packages").select("*").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  const { data: portfolio } = useQuery({
    queryKey: ["photo-portfolio"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_portfolio").select("*").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  const { data: travelFees } = useQuery({
    queryKey: ["photo-travel-fees"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_travel_fees").select("*").order("district");
      return data || [];
    },
  });

  const filteredPortfolio = useMemo(() => {
    if (!portfolio) return [];
    if (portfolioFilter === "all") return portfolio;
    return portfolio.filter((p: any) => p.media_type === portfolioFilter);
  }, [portfolio, portfolioFilter]);

  const currentTravelFee = useMemo(() => {
    if (locationType === "dhaka") return 0;
    const found = travelFees?.find((t: any) => t.district === district);
    return found?.fee || 0;
  }, [locationType, district, travelFees]);

  const totalPrice = useMemo(() => {
    return (selectedPackage?.price || 0) + currentTravelFee;
  }, [selectedPackage, currentTravelFee]);

  const openBooking = (service: any) => {
    setSelectedService(service);
    setStep(1);
    setBookingOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !phone || !address) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("photo_bookings").insert({
        booking_number: "temp",
        service_id: selectedService?.id,
        package_id: selectedPackage?.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        event_address: address,
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        event_time: eventTime || null,
        location_type: locationType,
        district: locationType === "outside_dhaka" ? district : "Dhaka",
        travel_fee: currentTravelFee,
        total: totalPrice,
        user_id: user?.id || null,
      });
      if (error) throw error;

      if (locationType === "outside_dhaka" && district) {
        await supabase.from("photo_travel_fees").update({ request_count: (travelFees?.find((t: any) => t.district === district)?.request_count || 0) + 1 }).eq("district", district);
      }

      toast.success("Booking submitted successfully! We'll contact you shortly.");
      setBookingOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setLocationType("dhaka");
    setDistrict("");
    setEventDate(undefined);
    setEventTime("");
    setSelectedPackage(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const siteUrl = window.location.origin;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Photography & Videography Services",
        provider: { "@type": "LocalBusiness", name: "Pikooly", url: siteUrl },
        areaServed: { "@type": "Country", name: "Bangladesh" },
        description: "Professional photography and videography services in Bangladesh",
      },
      {
        "@type": "LocalBusiness",
        name: "Pikooly Photography",
        url: `${siteUrl}/photography`,
        address: { "@type": "PostalAddress", addressCountry: "BD", addressLocality: "Dhaka" },
      },
    ],
  };

  const stepLabels = ["Location", "Date & Time", "Package", "Details"];

  return (
    <main className="min-h-screen">
      <SEOHead
        title="Photography & Videography Services — Pikooly"
        description="Professional photography, cinematic videography, and surprise gift combos in Bangladesh. Book now starting from ৳2,000."
        canonical={`${siteUrl}/photography`}
        jsonLd={jsonLd}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-primary/5 py-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Professional Services</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight font-serif">
            Capture Your <br className="md:hidden" />
            <span className="text-primary relative">
              Moments
              <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary/30" viewBox="0 0 200 8" fill="none">
                <path d="M1 5.5C47 2 153 2 199 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Professional photography & videography for weddings, birthdays, corporate events, and more across Bangladesh.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full px-8 h-12 text-sm font-semibold shadow-lg shadow-primary/20" onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Services <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-sm font-semibold" onClick={() => document.getElementById("portfolio-section")?.scrollIntoView({ behavior: "smooth" })}>
              View Portfolio
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-10 pt-8 border-t border-border/30">
            {[
              { value: "500+", label: "Events Covered" },
              { value: "4.9★", label: "Client Rating" },
              { value: "50+", label: "Happy Clients" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services-section" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">What We Offer</p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground font-serif">Our Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {services?.map((service: any, idx: number) => {
              const Icon = serviceIcons[idx] || Camera;
              return (
                <div
                  key={service.id}
                  className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
                >
                  {service.image_url && (
                    <div className="h-48 md:h-52 overflow-hidden relative">
                      <img src={service.image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-[10px] font-medium rounded-lg border-0">
                          Starting from {formatCurrency(service.starting_price)}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{service.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{service.short_description}</p>
                      </div>
                    </div>
                    {!service.image_url && (
                      <div className="flex items-center justify-between mb-4 py-3 px-4 rounded-xl bg-primary/5">
                        <span className="text-xs text-muted-foreground">Starting from</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(service.starting_price)}</span>
                      </div>
                    )}
                    <Button className="w-full rounded-xl h-10 text-sm font-semibold group-hover:shadow-md transition-shadow" onClick={() => openBooking(service)}>
                      Book Now <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Simple Process</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif">How It Works</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: MapPin, title: "Choose Location", desc: "Select Dhaka or outside" },
              { icon: Calendar, title: "Pick a Date", desc: "Choose your preferred date" },
              { icon: Package, title: "Select Package", desc: "Basic, Standard or Premium" },
              { icon: CheckCircle2, title: "Confirm Booking", desc: "We'll reach out to you" },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative mx-auto mb-3">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-0.5">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio-section" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Gallery</p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground font-serif mb-3">Our Best Shoots</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Browse our portfolio of stunning photography and videography work</p>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { key: "all", label: "All", icon: Sparkles },
              { key: "photo", label: "Photos", icon: Camera },
              { key: "video", label: "Videos", icon: Video },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setPortfolioFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all",
                  portfolioFilter === f.key
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>

          {filteredPortfolio.length > 0 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 max-w-6xl mx-auto">
              {filteredPortfolio.map((item: any) => (
                <div key={item.id} className="mb-3 md:mb-4 break-inside-avoid rounded-2xl overflow-hidden group relative">
                  {item.media_type === "photo" ? (
                    <img src={item.media_url} alt={item.title} className="w-full rounded-2xl group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="relative aspect-video bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover rounded-2xl" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted/50 rounded-2xl flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {item.video_embed_url && (
                        <a href={item.video_embed_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-foreground/20 group-hover:bg-foreground/30 transition-colors">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary shadow-xl shadow-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-4 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-primary-foreground text-sm font-semibold">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-9 w-9 text-muted-foreground opacity-40" />
              </div>
              <p className="text-muted-foreground font-medium">Portfolio coming soon!</p>
              <p className="text-xs text-muted-foreground mt-1">Stay tuned for our best work</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <Camera className="h-24 w-24 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif mb-3 relative z-10">
              Ready to Book Your Photographer?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto relative z-10">
              Get in touch with us today and let's make your special moments unforgettable.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Button size="lg" className="rounded-full px-8 h-12 text-sm font-semibold shadow-lg shadow-primary/20" onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}>
                <Camera className="h-4 w-4 mr-2" /> Book a Session
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-sm font-semibold" asChild>
                <a href="https://wa.me/8801234567890" target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4 mr-2" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-step Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                Book {selectedService?.title}
              </DialogTitle>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-5 mb-6">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const isActive = s === step;
                const isDone = s < step;
                return (
                  <div key={s} className="flex-1">
                    <div className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      isDone ? "bg-primary" : isActive ? "bg-primary" : "bg-muted"
                    )} />
                    <p className={cn(
                      "text-[10px] mt-1.5 font-medium transition-colors",
                      isActive ? "text-primary" : isDone ? "text-primary/60" : "text-muted-foreground/50"
                    )}>{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Select Location</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLocationType("dhaka")}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      locationType === "dhaka"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <MapPin className={cn("h-5 w-5 mb-2", locationType === "dhaka" ? "text-primary" : "text-muted-foreground")} />
                    <p className="font-semibold text-sm">Dhaka</p>
                    <p className="text-[11px] text-muted-foreground">No travel fee</p>
                  </button>
                  <button
                    onClick={() => setLocationType("outside_dhaka")}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      locationType === "outside_dhaka"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <MapPin className={cn("h-5 w-5 mb-2", locationType === "outside_dhaka" ? "text-primary" : "text-muted-foreground")} />
                    <p className="font-semibold text-sm">Outside Dhaka</p>
                    <p className="text-[11px] text-muted-foreground">Travel fee applies</p>
                  </button>
                </div>

                {locationType === "outside_dhaka" && (
                  <>
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        We are expanding! Leave your details, and we will try to arrange a photographer for you.
                      </p>
                    </div>
                    <Select value={district} onValueChange={setDistrict}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>
                        {travelFees?.filter((t: any) => t.district !== "Dhaka").map((t: any) => (
                          <SelectItem key={t.id} value={t.district}>
                            {t.district} {t.fee > 0 && `(+${formatCurrency(t.fee)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Button className="w-full rounded-xl h-11 text-sm font-semibold" onClick={() => setStep(2)} disabled={locationType === "outside_dhaka" && !district}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Select Date & Time</span>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left rounded-xl h-11", !eventDate && "text-muted-foreground")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {eventDate ? format(eventDate, "PPP") : "Pick event date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom" sideOffset={4}>
                    <CalendarUI mode="single" selected={eventDate} onSelect={(date) => { setEventDate(date); }} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Preferred Time
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {timeSlots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setEventTime(t)}
                        className={cn(
                          "rounded-lg py-2 text-[11px] font-medium transition-all border",
                          eventTime === t
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card border-border/50 text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl h-11">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!eventDate} className="flex-1 rounded-xl h-11 text-sm font-semibold">
                    Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Package */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Choose Package</span>
                </div>

                <div className="space-y-2.5">
                  {packages?.filter((p: any) => p.service_id === selectedService?.id).map((pkg: any) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={cn(
                        "w-full rounded-xl border-2 p-4 text-left transition-all",
                        selectedPackage?.id === pkg.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            selectedPackage?.id === pkg.id ? "border-primary" : "border-muted-foreground/30"
                          )}>
                            {selectedPackage?.id === pkg.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{pkg.name}</h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {pkg.duration}
                            </p>
                          </div>
                        </div>
                        <span className="text-base font-bold text-primary">{formatCurrency(pkg.price)}</span>
                      </div>
                      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {pkg.features.map((f: string, i: number) => (
                            <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {f}
                            </p>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl h-11">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedPackage} className="flex-1 rounded-xl h-11 text-sm font-semibold">
                    Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Your Details</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name *</label>
                    <Input placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number *</label>
                    <Input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email (optional)</label>
                    <Input placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Event Address *</label>
                    <Input placeholder="Full event address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-10" />
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-muted/30 border border-border/50 p-4 space-y-2.5">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-primary" /> Booking Summary
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService?.title}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{selectedPackage?.name} ({selectedPackage?.duration})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{eventDate ? format(eventDate, "PPP") : "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{eventTime || "Flexible"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{locationType === "dhaka" ? "Dhaka" : district}</span></div>
                    {currentTravelFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Travel Fee</span><span className="font-medium">{formatCurrency(currentTravelFee)}</span></div>}
                  </div>
                  <div className="flex justify-between items-center font-bold text-base border-t border-border/30 pt-2.5 mt-2.5">
                    <span>Total</span>
                    <span className="text-primary text-lg">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1 rounded-xl h-11">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting || !name || !phone || !address} className="flex-1 rounded-xl h-11 text-sm font-semibold">
                    {submitting ? "Submitting..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Photography;
