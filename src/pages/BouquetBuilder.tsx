import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, Link } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Flower2, Upload, Ruler, MessageSquare, ShoppingCart, ImagePlus, X, Palette, MapPin, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SEOHead from "@/components/seo/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PageBottomSEO from "@/components/seo/PageBottomSEO";
import DeliveryChecker from "@/components/product/DeliveryChecker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Flowers", icon: Flower2 },
  { id: 2, label: "Design", icon: Upload },
  { id: 3, label: "Size & Color", icon: Ruler },
  { id: 4, label: "Review", icon: MessageSquare },
];

const FIXED_SIZES = [
  { id: "s", name: "S", description: "Small bouquet" },
  { id: "m", name: "M", description: "Medium bouquet" },
  { id: "l", name: "L", description: "Large bouquet" },
  { id: "xl", name: "XL", description: "Extra large bouquet" },
];

const BouquetBuilder = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useMultiCurrency();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [selectedFlowers, setSelectedFlowers] = useState<Record<string, number>>({});
  const [designImages, setDesignImages] = useState<File[]>([]);
  const [designPreviews, setDesignPreviews] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("preferred_delivery_district") || "" : ""
  );
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  // Auto-open popup on mount if no district is selected
  useEffect(() => {
    if (!selectedDistrict) {
      const t = setTimeout(() => setLocationDialogOpen(true), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with DeliveryChecker (which writes to localStorage + dispatches event)
  useEffect(() => {
    const sync = () => {
      const d = localStorage.getItem("preferred_delivery_district") || "";
      setSelectedDistrict(d);
      if (d) setLocationDialogOpen(false);
    };
    window.addEventListener("delivery-district-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("delivery-district-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { data: bouquetColors = [] } = useQuery({
    queryKey: ["bouquet-colors-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bouquet_colors")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const selectedColor = bouquetColors.find((c: any) => c.id === selectedColorId);

  const { data: allFlowers = [] } = useQuery({
    queryKey: ["bouquet-flowers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bouquet_flowers").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch district info to determine delivery speed for the chosen district
  const { data: shippingDistricts = [] } = useQuery({
    queryKey: ["shipping-districts-builder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_districts")
        .select("name, same_day_fee, next_day_fee")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Determine delivery speed available for the selected district
  const deliverySpeed: "same_day" | "next_day" | "standard" | null = useMemo(() => {
    if (!selectedDistrict) return null;
    const d = shippingDistricts.find((x: any) => x.name === selectedDistrict);
    if (!d) return "standard";
    if (d.same_day_fee !== null && d.same_day_fee !== undefined) return "same_day";
    if (d.next_day_fee !== null && d.next_day_fee !== undefined) return "next_day";
    return "standard";
  }, [selectedDistrict, shippingDistricts]);

  // Filter flowers by selected district + delivery speed.
  // Logic: prefer speed-specific list when set; otherwise fall back to general available_districts.
  const flowers = useMemo(() => {
    if (!selectedDistrict) return allFlowers;
    return allFlowers.filter((f: any) => {
      const speedList: string[] =
        deliverySpeed === "same_day" ? (f.same_day_districts || []) :
        deliverySpeed === "next_day" ? (f.next_day_districts || []) :
        [];
      // If admin configured a speed-specific list, it takes priority
      if (speedList.length > 0) return speedList.includes(selectedDistrict);
      // Otherwise use the general allow-list (empty = available everywhere)
      const general: string[] = f.available_districts || [];
      return general.length === 0 || general.includes(selectedDistrict);
    });
  }, [allFlowers, selectedDistrict, deliverySpeed]);

  // Auto-remove flowers from selection if they become unavailable for the chosen district
  useEffect(() => {
    if (!selectedDistrict) return;
    setSelectedFlowers((prev) => {
      const visibleIds = new Set(flowers.map((f: any) => f.id));
      const next: Record<string, number> = {};
      let changed = false;
      Object.entries(prev).forEach(([id, qty]) => {
        if (visibleIds.has(id)) next[id] = qty;
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [flowers, selectedDistrict]);

  const selectedFlowersList = useMemo(() => {
    return Object.entries(selectedFlowers)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const f = allFlowers.find((fl: any) => fl.id === id);
        return f ? { ...f, qty } : null;
      })
      .filter(Boolean) as any[];
  }, [selectedFlowers, allFlowers]);

  const selectedSizeItem = FIXED_SIZES.find((s) => s.id === selectedSize);

  const MAKING_CHARGE = 420;

  const flowersPrice = useMemo(() => {
    let total = 0;
    selectedFlowersList.forEach((f) => { total += f.price * f.qty; });
    return total;
  }, [selectedFlowersList]);

  const totalPrice = flowersPrice + MAKING_CHARGE;

  const toggleFlower = (id: string) => {
    setSelectedFlowers((prev) => {
      const current = prev[id] || 0;
      if (current === 0) return { ...prev, [id]: 1 };
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateFlowerQty = (id: string, delta: number) => {
    setSelectedFlowers((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  };

  const handleDesignUpload = (files: FileList | null) => {
    if (!files) return;
    const maxImages = 3;
    const remaining = maxImages - designImages.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });
    if (newFiles.length > 0) {
      setDesignImages((prev) => [...prev, ...newFiles]);
      setDesignPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeDesignImage = (index: number) => {
    URL.revokeObjectURL(designPreviews[index]);
    setDesignImages((prev) => prev.filter((_, i) => i !== index));
    setDesignPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === 1) return selectedFlowersList.length > 0;
    if (step === 2) return true; // design upload is optional
    if (step === 3) {
      if (!selectedSize) return false;
      // If admin has configured colors, require selection
      if (bouquetColors.length > 0 && !selectedColorId) return false;
      return true;
    }
    return true;
  };

  const handleOrder = () => {
    const sizeLabel = selectedSizeItem ? ` ${selectedSizeItem.name}` : "";
    const colorLabel = selectedColor ? ` - ${selectedColor.name}` : "";
    const bouquetName = `Custom Bouquet${sizeLabel}${colorLabel} (${selectedFlowersList.map((f) => `${f.name} x${f.qty}`).join(", ")})`;
    addItem({
      id: `bouquet-${Date.now()}`,
      name: bouquetName,
      price: totalPrice,
      image: selectedFlowersList[0]?.image_url || "/placeholder.svg",
      category: "Custom Bouquet",
      inStock: true,
    }, undefined, true, selectedColor ? {
      color: { name: selectedColor.name, hex: selectedColor.hex_code },
    } : undefined);
    navigate("/checkout");
  };

  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  const seoTitle = settings.bouquet_seo_title || "Custom Flower Bouquet Builder | Design Your Own Bouquet - Pikooly";
  const seoDescription = settings.bouquet_seo_description || "Create your perfect custom flower bouquet online at Pikooly. Choose from fresh roses, lilies, sunflowers & more. Pick your size, add a personal gift message, and enjoy same-day delivery across Bangladesh.";
  const seoOgImage = settings.bouquet_seo_og_image || undefined;
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": settings.bouquet_seo_jsonld_name || "Custom Flower Bouquet Builder - Pikooly",
    "description": settings.bouquet_seo_jsonld_description || "Design your own custom flower bouquet online. Choose from fresh roses, lilies, sunflowers & more.",
    "provider": { "@type": "Organization", "name": settings.store_name || "Pikooly" },
    "areaServed": "Bangladesh",
    "url": `${window.location.origin}/custom-bouquet`
  };

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={`${window.location.origin}/custom-bouquet`}
        ogType="product"
        ogImage={seoOgImage}
        jsonLd={seoJsonLd}
      />
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Custom Bouquet</span>
      </nav>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between">
          {STEPS.map((s) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className="flex flex-col items-center gap-1.5 group"
                disabled={s.id > step}
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isActive ? "bg-primary text-primary-foreground scale-110" :
                  isDone ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <div>
            {/* Compact location summary / change button */}
            <button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              className="mb-6 w-full max-w-md flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Gift Receiver's Location</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedDistrict || "Select your district"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0">
                <Pencil className="h-3 w-3" />
                {selectedDistrict ? "Change" : "Choose"}
              </span>
            </button>

            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
              <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    Gift Receiver's Location
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <DeliveryChecker product={{ same_day_districts: [], next_day_districts: [], standard_delivery_days: 3 }} />
                  {selectedDistrict && (
                    <Button onClick={() => setLocationDialogOpen(false)} className="w-full mt-4">
                      Continue
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Your Flowers</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedDistrict
                ? `Showing flowers available in ${selectedDistrict}${
                    deliverySpeed === "same_day" ? " (Same-Day Delivery)" :
                    deliverySpeed === "next_day" ? " (Next-Day Delivery)" :
                    ""
                  }`
                : "Select your delivery location above to see flowers available in your area"}
            </p>
            {flowers.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30 mb-6">
                <Flower2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No flowers available in {selectedDistrict}</p>
                <p className="text-xs text-muted-foreground mt-1">Please choose a different district to see available flowers.</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {flowers.map((flower: any) => {
                const qty = selectedFlowers[flower.id] || 0;
                const isSelected = qty > 0;
                const sameDay = (flower.same_day_districts || []) as string[];
                const nextDay = (flower.next_day_districts || []) as string[];
                let flowerSpeed: "same_day" | "next_day" | null = null;
                if (selectedDistrict) {
                  if (sameDay.includes(selectedDistrict)) flowerSpeed = "same_day";
                  else if (nextDay.includes(selectedDistrict)) flowerSpeed = "next_day";
                  else if (deliverySpeed === "same_day" || deliverySpeed === "next_day") flowerSpeed = deliverySpeed;
                }
                return (
                  <div
                    key={flower.id}
                    className={cn(
                      "relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-card",
                      isSelected ? "border-primary shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="aspect-square bg-secondary/20 overflow-hidden relative" onClick={() => toggleFlower(flower.id)}>
                      <img src={flower.image_url || "/placeholder.svg"} alt={flower.name} className="w-full h-full object-cover" loading="lazy" />
                      {flowerSpeed && (
                        <div
                          className={cn(
                            "absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shadow-sm",
                            flowerSpeed === "same_day"
                              ? "bg-primary text-primary-foreground"
                              : "bg-amber-500 text-white"
                          )}
                        >
                          {flowerSpeed === "same_day" ? "Same-Day" : "Next-Day"}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1">{flower.name}</h3>
                      <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(flower.price)}</p>
                      {isSelected && (
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateFlowerQty(flower.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">−</button>
                          <span className="text-sm font-semibold min-w-[20px] text-center">{qty}</span>
                          <button onClick={() => updateFlowerQty(flower.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Upload Your Design</h2>
            <p className="text-sm text-muted-foreground mb-6">Upload your preferred bouquet design (optional, max 3 images)</p>

            <div className="max-w-md space-y-4">
              <div className="flex gap-3 flex-wrap">
                {designPreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border group">
                    <img src={src} alt={`Design ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeDesignImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {designImages.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-1.5 text-primary/60 hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus size={24} />
                    <span className="text-[10px] font-medium">Add Photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleDesignUpload(e.target.files);
                  e.target.value = "";
                }}
              />

              <p className="text-xs text-muted-foreground">
                Share a photo of how you'd like your bouquet to look. We'll try to match it as closely as possible.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Size & Color</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick your bouquet size and color theme</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" /> Size
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FIXED_SIZES.map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <div
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={cn(
                          "rounded-xl border-2 p-4 cursor-pointer transition-all bg-card text-center",
                          isSelected ? "border-primary shadow-md bg-primary/5" : "border-border/50 hover:border-primary/30"
                        )}
                      >
                        <div className="text-2xl font-display font-bold text-foreground mb-1">{size.name}</div>
                        <p className="text-xs text-muted-foreground">{size.description}</p>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mt-2">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {bouquetColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" /> Color Theme
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {bouquetColors.map((c: any) => {
                      const active = selectedColorId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColorId(c.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 transition-all",
                            active ? "scale-105" : "opacity-80 hover:opacity-100"
                          )}
                        >
                          <span
                            className={cn(
                              "w-12 h-12 rounded-full border-2 shadow-sm flex items-center justify-center",
                              active ? "border-primary ring-2 ring-primary/30" : "border-border"
                            )}
                            style={{ backgroundColor: c.hex_code }}
                          >
                            {active && <Check className="h-5 w-5 text-white drop-shadow" />}
                          </span>
                          <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Review & Order</h2>
            <p className="text-sm text-muted-foreground mb-6">Review your custom bouquet</p>

            <div className="space-y-4 max-w-xl">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Flower2 className="h-4 w-4 text-primary" /> Flowers</h3>
                {selectedFlowersList.map((f) => (
                  <div key={f.id} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-foreground">{f.name} × {f.qty}</span>
                    <span className="text-muted-foreground">{formatPrice(f.price * f.qty)}</span>
                  </div>
                ))}
              </div>


              {designPreviews.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Your Design</h3>
                  <div className="flex gap-2">
                    {designPreviews.map((src, i) => (
                      <img key={i} src={src} alt={`Design ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                </div>
              )}

              {selectedSizeItem && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Size & Color</h3>
                  <div className="text-sm text-foreground">{selectedSizeItem.name} — {selectedSizeItem.description}</div>
                  {selectedColor && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: selectedColor.hex_code }}
                      />
                      <span>Color: <span className="font-medium">{selectedColor.name}</span></span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Gift Message (Optional)</h3>
                <Textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Write a personal message for the recipient..."
                  rows={3}
                />
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-foreground font-medium">Bouquet Making Charge</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Hand arrangement, decoration & premium packaging</p>
                  </div>
                  <span className="text-muted-foreground font-medium">{formatPrice(MAKING_CHARGE)}</span>
                </div>
              </div>

              <div className="bg-primary/5 border-2 border-primary rounded-xl p-4 flex justify-between items-center">
                <span className="font-display font-bold text-lg text-foreground">Total</span>
                <span className="font-display font-bold text-xl text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="text-sm font-semibold text-primary">
          {flowersPrice > 0 && `Flowers: ${formatPrice(flowersPrice)}`}
        </div>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleOrder} className="gap-1.5">
            <ShoppingCart className="h-4 w-4" /> Order Now
          </Button>
        )}
      </div>

      <PageBottomSEO prefix="bouquet" defaultTitle="Custom Bouquet Builder - Design Your Own Bouquet" />
    </main>
  );
};

export default BouquetBuilder;
