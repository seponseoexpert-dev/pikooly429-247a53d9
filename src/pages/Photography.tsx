import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import SEOHead from "@/components/seo/SEOHead";
import { Camera, Video, Gift, MapPin, Calendar, Package, User, ChevronRight, ChevronLeft, Filter, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const { formatPrice } = useCurrency();
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

  return (
    <main className="min-h-screen">
      <SEOHead
        title="Photography & Videography Services — Pikooly"
        description="Professional photography, cinematic videography, and surprise gift combos in Bangladesh. Book now starting from ৳2,000."
        canonical={`${siteUrl}/photography`}
        jsonLd={jsonLd}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">📸 Professional Services</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Capture Your <span className="text-primary">Moments</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Professional photography & videography services for weddings, birthdays, corporate events, and more across Bangladesh.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services?.map((service: any, idx: number) => {
              const Icon = serviceIcons[idx] || Camera;
              return (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
                  {service.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={service.image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.short_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Starting from</span>
                      <span className="text-xl font-bold text-primary">{formatPrice(service.starting_price)}</span>
                    </div>
                    <Button className="w-full mt-4" onClick={() => openBooking(service)}>
                      Book Now <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Our Best Shoots</h2>
          <p className="text-muted-foreground text-center mb-8">Browse our portfolio of stunning photography and videography work</p>

          <div className="flex justify-center gap-2 mb-8">
            {["all", "photo", "video"].map((f) => (
              <Button key={f} variant={portfolioFilter === f ? "default" : "outline"} size="sm" onClick={() => setPortfolioFilter(f)}>
                {f === "all" ? <Filter className="h-4 w-4 mr-1" /> : f === "photo" ? <Camera className="h-4 w-4 mr-1" /> : <Video className="h-4 w-4 mr-1" />}
                {f === "all" ? "All" : f === "photo" ? "Photos" : "Videos"}
              </Button>
            ))}
          </div>

          {filteredPortfolio.length > 0 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 max-w-6xl mx-auto">
              {filteredPortfolio.map((item: any) => (
                <div key={item.id} className="mb-4 break-inside-avoid rounded-xl overflow-hidden group relative">
                  {item.media_type === "photo" ? (
                    <img src={item.media_url} alt={item.title} className="w-full rounded-xl group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="relative aspect-video bg-foreground/5 rounded-xl flex items-center justify-center">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-xl" />
                      )}
                      {item.video_embed_url && (
                        <a href={item.video_embed_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                            <Play className="h-6 w-6 text-primary-foreground ml-1" />
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent p-3 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-primary-foreground text-sm font-medium">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Portfolio coming soon! Stay tuned for our best work.</p>
            </div>
          )}
        </div>
      </section>

      {/* Multi-step Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Book {selectedService?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={cn("flex-1 h-1.5 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" /> Step 1: Select Location
              </div>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dhaka">Dhaka</SelectItem>
                  <SelectItem value="outside_dhaka">Outside Dhaka (Request Service)</SelectItem>
                </SelectContent>
              </Select>
              {locationType === "outside_dhaka" && (
                <>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                    🌍 We are expanding! Leave your details, and we will try to arrange a photographer for you.
                  </div>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                    <SelectContent>
                      {travelFees?.filter((t: any) => t.district !== "Dhaka").map((t: any) => (
                        <SelectItem key={t.id} value={t.district}>
                          {t.district} {t.fee > 0 && `(+${formatPrice(t.fee)} travel fee)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button className="w-full" onClick={() => setStep(2)} disabled={locationType === "outside_dhaka" && !district}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" /> Step 2: Select Date & Time
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !eventDate && "text-muted-foreground")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {eventDate ? format(eventDate, "PPP") : "Pick event date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={eventDate} onSelect={setEventDate} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <div>
                <p className="text-sm font-medium mb-2">Preferred Time</p>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <Button key={t} variant={eventTime === t ? "default" : "outline"} size="sm" onClick={() => setEventTime(t)} className="text-xs">
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!eventDate} className="flex-1">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Package */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="h-4 w-4" /> Step 3: Choose Package
              </div>
              <div className="space-y-3">
                {packages?.filter((p: any) => p.service_id === selectedService?.id).map((pkg: any) => (
                  <Card
                    key={pkg.id}
                    className={cn("cursor-pointer transition-all", selectedPackage?.id === pkg.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/30")}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{pkg.name}</h4>
                          <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                        </div>
                        <span className="text-lg font-bold text-primary">{formatPrice(pkg.price)}</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {(Array.isArray(pkg.features) ? pkg.features : []).map((f: string, i: number) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-primary">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!selectedPackage} className="flex-1">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" /> Step 4: Your Details
              </div>
              <Input placeholder="Full Name *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Phone Number *" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Event Address *" value={address} onChange={(e) => setAddress(e.target.value)} />

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2 text-sm">
                  <h4 className="font-semibold">Booking Summary</h4>
                  <div className="flex justify-between"><span>Service:</span><span>{selectedService?.title}</span></div>
                  <div className="flex justify-between"><span>Package:</span><span>{selectedPackage?.name} ({selectedPackage?.duration})</span></div>
                  <div className="flex justify-between"><span>Date:</span><span>{eventDate ? format(eventDate, "PPP") : "-"}</span></div>
                  <div className="flex justify-between"><span>Time:</span><span>{eventTime || "Flexible"}</span></div>
                  <div className="flex justify-between"><span>Location:</span><span>{locationType === "dhaka" ? "Dhaka" : district}</span></div>
                  {currentTravelFee > 0 && <div className="flex justify-between"><span>Travel Fee:</span><span>{formatPrice(currentTravelFee)}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total:</span><span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || !name || !phone || !address} className="flex-1">
                  {submitting ? "Submitting..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Photography;
