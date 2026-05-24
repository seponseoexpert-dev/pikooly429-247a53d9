import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, Link } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Flower2, Upload, MessageSquare, ShoppingCart, ImagePlus, X, MapPin, Pencil, Gift, Plus, Sparkles, Loader2, RefreshCw, Zap, Clock } from "lucide-react";
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
  { id: 3, label: "Add-ons", icon: Gift },
  { id: 4, label: "Review", icon: MessageSquare },
];

const DESIGN_SERVICE_CHARGE = 150;

const BouquetBuilder = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useMultiCurrency();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [selectedFlowers, setSelectedFlowers] = useState<Record<string, number>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, number>>({}); // flowerId -> color index
  const [designImages, setDesignImages] = useState<File[]>([]);
  const [designPreviews, setDesignPreviews] = useState<string[]>([]);
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [aiPreviewError, setAiPreviewError] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
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

  const { data: addonProducts = [] } = useQuery<any[]>({
    queryKey: ["bouquet-builder-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_addons")
        .select("product_id, sort_order, products!inner(id, name, slug, price, original_price, image_url, is_active)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ products: any | null }>;
      return rows.map((r) => r.products).filter((p: any) => Boolean(p?.is_active));
    },
    staleTime: 5 * 60 * 1000,
  });

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

  // Per-flower delivery speed for the selected district.
  // Returns "same_day" | "next_day" | "slow" (2-3 days) | "unavailable" | null (no district chosen).
  type FlowerSpeed = "same_day" | "next_day" | "slow" | "unavailable";
  const getFlowerSpeed = (f: any): FlowerSpeed | null => {
    if (!selectedDistrict) return null;
    const sameDay: string[] = f.same_day_districts || [];
    const nextDay: string[] = f.next_day_districts || [];
    const general: string[] = f.available_districts || [];
    if (sameDay.includes(selectedDistrict)) return "same_day";
    if (nextDay.includes(selectedDistrict)) return "next_day";
    if (general.length === 0 || general.includes(selectedDistrict)) return "slow";
    return "unavailable";
  };

  // Show ALL active flowers; the per-card badge tells the user what's possible.
  const flowers = allFlowers;

  // Auto-remove flowers from selection if they become unavailable for the chosen district
  useEffect(() => {
    if (!selectedDistrict) return;
    setSelectedFlowers((prev) => {
      const next: Record<string, number> = {};
      let changed = false;
      Object.entries(prev).forEach(([id, qty]) => {
        const f = allFlowers.find((fl: any) => fl.id === id);
        const sp = f ? getFlowerSpeed(f) : "unavailable";
        if (sp && sp !== "unavailable") next[id] = qty;
        else changed = true;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFlowers, selectedDistrict]);

  // Slowest selected flower → bouquet's effective delivery time
  const speedRank: Record<FlowerSpeed, number> = { same_day: 0, next_day: 1, slow: 2, unavailable: 3 };
  const bouquetSpeed: FlowerSpeed | null = useMemo(() => {
    if (!selectedDistrict) return null;
    const selectedIds = Object.entries(selectedFlowers).filter(([, q]) => q > 0).map(([id]) => id);
    if (!selectedIds.length) return null;
    let worst: FlowerSpeed = "same_day";
    selectedIds.forEach((id) => {
      const f = allFlowers.find((fl: any) => fl.id === id);
      const sp = f ? getFlowerSpeed(f) : null;
      if (sp && speedRank[sp] > speedRank[worst]) worst = sp;
    });
    return worst;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlowers, allFlowers, selectedDistrict]);

  // Flowers that are dragging the bouquet down (slower than the district's best possible speed)
  const slowSelectedFlowers = useMemo(() => {
    if (!selectedDistrict || !bouquetSpeed || bouquetSpeed === "same_day") return [] as any[];
    const districtBest: FlowerSpeed = deliverySpeed === "same_day" ? "same_day" : deliverySpeed === "next_day" ? "next_day" : "slow";
    return Object.entries(selectedFlowers)
      .filter(([, q]) => q > 0)
      .map(([id]) => allFlowers.find((fl: any) => fl.id === id))
      .filter((f: any) => {
        if (!f) return false;
        const sp = getFlowerSpeed(f);
        return sp && speedRank[sp] > speedRank[districtBest];
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlowers, allFlowers, selectedDistrict, deliverySpeed, bouquetSpeed]);

  const removeSlowFlowers = () => {
    setSelectedFlowers((prev) => {
      const next = { ...prev };
      slowSelectedFlowers.forEach((f: any) => { delete next[f.id]; });
      return next;
    });
    toast.success("Slow items removed — your bouquet now ships faster!");
  };

  const speedLabel = (s: FlowerSpeed | null) =>
    s === "same_day" ? "Same-Day" : s === "next_day" ? "Next-Day" : s === "slow" ? "2-3 Days" : s === "unavailable" ? "Unavailable" : "";

  const selectedFlowersList = useMemo(() => {
    return Object.entries(selectedFlowers)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const f = allFlowers.find((fl: any) => fl.id === id);
        if (!f) return null;
        const colors: any[] = Array.isArray(f.colors) ? f.colors : [];
        const colorIdx = selectedColors[id] ?? 0;
        const color = colors[colorIdx] || null;
        const displayName = color?.name ? `${color.name} ${f.name}` : f.name;
        const displayImage = color?.image_url || f.image_url;
        return { ...f, qty, color, displayName, displayImage };
      })
      .filter(Boolean) as any[];
  }, [selectedFlowers, selectedColors, allFlowers]);

  const selectedAddonsList = useMemo(() => {
    return Object.entries(selectedAddons)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = addonProducts.find((ap: any) => ap.id === id);
        return p ? { ...p, qty } : null;
      })
      .filter(Boolean) as any[];
  }, [selectedAddons, addonProducts]);

  const MAKING_CHARGE = 420;
  const designCharge = designImages.length > 0 ? DESIGN_SERVICE_CHARGE : 0;

  const flowersPrice = useMemo(() => {
    let total = 0;
    selectedFlowersList.forEach((f) => { total += f.price * f.qty; });
    return total;
  }, [selectedFlowersList]);

  const addonsPrice = useMemo(() => {
    let total = 0;
    selectedAddonsList.forEach((a) => { total += Number(a.price) * a.qty; });
    return total;
  }, [selectedAddonsList]);

  const totalPrice = flowersPrice + MAKING_CHARGE + designCharge + addonsPrice;

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
      setAiPreviewUrl(null);
      setAiPreviewError(null);
    }
  };

  const removeDesignImage = (index: number) => {
    URL.revokeObjectURL(designPreviews[index]);
    setDesignImages((prev) => prev.filter((_, i) => i !== index));
    setDesignPreviews((prev) => prev.filter((_, i) => i !== index));
    setAiPreviewUrl(null);
    setAiPreviewError(null);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const generateAiPreview = async () => {
    if (designImages.length === 0) {
      toast.error("Upload a design photo first");
      return;
    }
    if (selectedFlowersList.length === 0) {
      toast.error("Select at least one flower in step 1");
      return;
    }
    setAiPreviewLoading(true);
    setAiPreviewError(null);
    setAiPreviewUrl(null);
    try {
      const dataUrls = await Promise.all(designImages.map(fileToDataUrl));
      const { data, error } = await supabase.functions.invoke("ai-bouquet-preview", {
        body: {
          flowers: selectedFlowersList.map((f) => ({ name: f.displayName, qty: f.qty })),
          designImages: dataUrls,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const url = (data as any)?.previewUrl;
      if (!url) throw new Error("No preview returned");
      setAiPreviewUrl(url);
      toast.success("AI preview ready!");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate preview";
      setAiPreviewError(msg);
      toast.error(msg);
    } finally {
      setAiPreviewLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedFlowersList.length > 0;
    if (step === 2) return true; // design upload is optional
    if (step === 3) return true; // addons are optional
    return true;
  };

  const handleOrder = () => {
    const addonLabel = selectedAddonsList.length > 0
      ? ` + Addons: ${selectedAddonsList.map((a) => `${a.name} x${a.qty}`).join(", ")}`
      : "";
    const designLabel = designImages.length > 0 ? " + Custom Design" : "";
    const bouquetName = `Custom Bouquet (${selectedFlowersList.map((f) => `${f.displayName} x${f.qty}`).join(", ")})${designLabel}${addonLabel}`;
    addItem({
      id: `bouquet-${Date.now()}`,
      name: bouquetName,
      price: totalPrice,
      image: selectedFlowersList[0]?.displayImage || "/placeholder.svg",
      category: "Custom Bouquet",
      inStock: true,
    }, undefined, true);
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
            {/* Premium location card with live delivery speed */}
            <button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              className="mb-5 w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 px-3.5 py-3 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Gift Receiver's Location</p>
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {selectedDistrict || "Tap to choose district"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedDistrict && deliverySpeed && (
                  <span
                    className={cn(
                      "hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1",
                      deliverySpeed === "same_day"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800"
                        : deliverySpeed === "next_day"
                          ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
                          : "bg-muted text-muted-foreground ring-border"
                    )}
                  >
                    {deliverySpeed === "same_day" ? <Zap className="h-2.5 w-2.5 fill-current" /> : <Clock className="h-2.5 w-2.5" />}
                    {deliverySpeed === "same_day" ? "Same-Day" : deliverySpeed === "next_day" ? "Next-Day" : "Standard"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Pencil className="h-3 w-3" />
                  {selectedDistrict ? "Change" : "Choose"}
                </span>
              </div>
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
                  <DeliveryChecker categoryId="00000000-0000-0000-0000-0000000b0001" product={{ same_day_districts: [], next_day_districts: [], standard_delivery_days: 3 }} />
                  {selectedDistrict && (
                    <Button onClick={() => setLocationDialogOpen(false)} className="w-full mt-4">
                      Continue
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1.5">Choose Your Flowers</h2>
            {selectedDistrict ? (
              <div className="flex items-center flex-wrap gap-2 mb-5">
                <p className="text-sm text-muted-foreground">
                  Available in <span className="font-semibold text-foreground">{selectedDistrict}</span>
                </p>
                {deliverySpeed && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                      deliverySpeed === "same_day"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : deliverySpeed === "next_day"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {deliverySpeed === "same_day" ? <Zap className="h-3 w-3 fill-current" /> : <Clock className="h-3 w-3" />}
                    {deliverySpeed === "same_day" ? "Same-Day Delivery" : deliverySpeed === "next_day" ? "Next-Day Delivery" : "Standard Delivery"}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-5">Select your delivery location above to see flowers available in your area.</p>
            )}
            {flowers.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30 mb-6">
                <Flower2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No flowers available yet</p>
              </div>
            )}

            {/* Slow-flower warning: shown when bouquet is held back by some flowers */}
            {selectedDistrict && slowSelectedFlowers.length > 0 && (
              <div className="mb-5 rounded-xl border-2 border-amber-300/60 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800/60 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Bouquet ships in {speedLabel(bouquetSpeed)}
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-0.5 leading-snug">
                      {slowSelectedFlowers.length === 1 ? (
                        <><span className="font-semibold">{slowSelectedFlowers[0].name}</span> needs longer in {selectedDistrict}. Remove it to ship faster.</>
                      ) : (
                        <>{slowSelectedFlowers.length} flowers need longer in {selectedDistrict}: <span className="font-semibold">{slowSelectedFlowers.map((f: any) => f.name).join(", ")}</span>. Remove them to ship faster.</>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={removeSlowFlowers}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-200/70 dark:bg-amber-900/50 hover:bg-amber-300/70 dark:hover:bg-amber-900/70 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove slow items
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {flowers.map((flower: any) => {
                const qty = selectedFlowers[flower.id] || 0;
                const isSelected = qty > 0;
                const flowerSpeed = getFlowerSpeed(flower);
                const isUnavailable = flowerSpeed === "unavailable";
                const flowerColors: any[] = Array.isArray(flower.colors) ? flower.colors : [];
                const hasColors = flowerColors.length > 0;
                const activeColorIdx = selectedColors[flower.id] ?? 0;
                const activeColor = hasColors ? flowerColors[activeColorIdx] : null;
                const cardImage = activeColor?.image_url || flower.image_url || "/placeholder.svg";
                const badgeStyle =
                  flowerSpeed === "same_day"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white ring-emerald-300/40"
                    : flowerSpeed === "next_day"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-amber-300/40"
                      : flowerSpeed === "slow"
                        ? "bg-gradient-to-r from-slate-500 to-slate-600 text-white ring-slate-300/40"
                        : "bg-destructive/90 text-destructive-foreground ring-destructive/30";
                const BadgeIcon = flowerSpeed === "same_day" ? Zap : flowerSpeed === "unavailable" ? X : Clock;
                return (
                  <div
                    key={flower.id}
                    className={cn(
                      "relative rounded-xl border-2 overflow-hidden transition-all bg-card",
                      isUnavailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                      isSelected ? "border-primary shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div
                      className="aspect-square bg-secondary/20 overflow-hidden relative"
                      onClick={() => { if (!isUnavailable) toggleFlower(flower.id); else toast.error(`${flower.name} not available in ${selectedDistrict}`); }}
                    >
                      <img src={cardImage} alt={flower.name} className={cn("w-full h-full object-cover transition-all", isUnavailable && "grayscale")} loading="lazy" />
                      {flowerSpeed && (
                        <div className={cn("absolute top-2 left-2 inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[10px] font-bold shadow-md backdrop-blur-sm ring-1", badgeStyle)}>
                          <BadgeIcon className={cn("h-2.5 w-2.5", flowerSpeed === "same_day" && "fill-current")} />
                          {speedLabel(flowerSpeed)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {hasColors && !isUnavailable && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-center">
                          <div className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-background/85 backdrop-blur-sm shadow ring-1 ring-border/60">
                            {flowerColors.slice(0, 5).map((c: any, i: number) => {
                              const isActive = activeColorIdx === i;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedColors((prev) => ({ ...prev, [flower.id]: i }));
                                    if (!isSelected) toggleFlower(flower.id);
                                  }}
                                  aria-label={`Choose ${c.name || "color"}`}
                                  className={cn(
                                    "h-4 w-4 rounded-full border transition-all",
                                    isActive
                                      ? "border-foreground scale-125 ring-2 ring-background"
                                      : "border-border/70 hover:scale-110"
                                  )}
                                  style={{ backgroundColor: c.hex || "#ccc" }}
                                  title={c.name}
                                />
                              );
                            })}
                            {flowerColors.length > 5 && (
                              <span className="text-[9px] font-semibold text-muted-foreground px-0.5">+{flowerColors.length - 5}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1">
                        {activeColor?.name ? `${activeColor.name} ${flower.name}` : flower.name}
                      </h3>
                      <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(flower.price)}</p>
                      {isSelected && !isUnavailable && (
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
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Your Design</h2>
            <p className="text-sm text-muted-foreground mb-6">Upload a design photo, or skip for our default plain white wrap (no extra charge).</p>

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  designPreviews.forEach((p) => URL.revokeObjectURL(p));
                  setDesignImages([]);
                  setDesignPreviews([]);
                }}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all bg-card",
                  designImages.length === 0
                    ? "border-primary shadow-md bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">Plain White Wrap</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">FREE</span>
                </div>
                <p className="text-xs text-muted-foreground">No custom design — flowers wrapped beautifully in our signature plain white sleeve. No extra charge.</p>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all bg-card",
                  designImages.length > 0
                    ? "border-primary shadow-md bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">Upload Custom Design</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+{formatPrice(DESIGN_SERVICE_CHARGE)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Share up to 3 photos of your dream bouquet. Our designer will craft it to match your vision.</p>
              </button>
            </div>

            {designImages.length > 0 && (
              <div className="max-w-md space-y-3">
                <div className="flex gap-3 flex-wrap">
                  {designPreviews.map((src, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border group">
                      <img src={src} alt={`Design ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeDesignImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
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
                      <span className="text-[10px] font-medium">Add More</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Max 3 images, 5MB each. Designer service charge: {formatPrice(DESIGN_SERVICE_CHARGE)}.</p>

                {/* AI Preview Section */}
                <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">AI Bouquet Preview</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          See how your bouquet will look — generated from your design + selected flowers.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={generateAiPreview}
                      disabled={aiPreviewLoading || selectedFlowersList.length === 0}
                      className="shrink-0 gap-1.5"
                    >
                      {aiPreviewLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
                      ) : aiPreviewUrl ? (
                        <><RefreshCw className="h-3.5 w-3.5" />Regenerate</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" />Generate</>
                      )}
                    </Button>
                  </div>

                  {selectedFlowersList.length === 0 && !aiPreviewUrl && !aiPreviewLoading && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
                      ⚠ Go back to step 1 and select at least one flower to enable preview.
                    </p>
                  )}

                  {aiPreviewLoading && (
                    <div className="aspect-square rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-7 w-7 text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground">Crafting your preview… (10–30s)</p>
                    </div>
                  )}

                  {aiPreviewError && !aiPreviewLoading && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                      {aiPreviewError}
                    </div>
                  )}

                  {aiPreviewUrl && !aiPreviewLoading && (
                    <div className="space-y-2">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-card">
                        <img src={aiPreviewUrl} alt="AI generated bouquet preview" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        AI-generated preview for reference only. Final bouquet handcrafted by our designer.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Recommended Add-ons</h2>
            <p className="text-sm text-muted-foreground mb-6">Make your gift extra special with these popular add-ons (optional).</p>

            {addonProducts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No add-ons available right now</p>
                <p className="text-xs text-muted-foreground mt-1">You can continue to review your bouquet.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2.5">
                {addonProducts.map((p: any) => {
                  const qty = selectedAddons[p.id] || 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "snap-start shrink-0 w-[114px] sm:w-[132px] md:w-[150px] lg:w-[166px] bg-card rounded-md border shadow-sm overflow-hidden flex flex-col transition-colors",
                        isSelected ? "border-primary" : "border-border/70"
                      )}
                    >
                      <div
                        className="block p-2 pb-1 bg-card cursor-pointer relative"
                        onClick={() =>
                          setSelectedAddons((prev) => {
                            const c = prev[p.id] || 0;
                            if (c === 0) return { ...prev, [p.id]: 1 };
                            const { [p.id]: _, ...rest } = prev;
                            return rest;
                          })
                        }
                      >
                        <img
                          src={p.image_url || "/placeholder.svg"}
                          alt={p.name}
                          loading="lazy"
                          className="w-full aspect-square object-cover rounded-[4px] bg-muted/20"
                        />
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="px-2 pb-2 pt-1 flex flex-col gap-1 flex-1">
                        <p className="text-[12px] sm:text-[13px] text-foreground line-clamp-2 leading-[1.18] min-h-[2.36em]">{p.name}</p>
                        <p className="text-[13px] sm:text-sm font-bold text-foreground tabular-nums leading-tight">{formatPrice(Number(p.price))}</p>
                        {isSelected ? (
                          <div className="mt-1 h-8 rounded-[4px] border border-primary flex items-center justify-between px-1">
                            <button
                              onClick={() =>
                                setSelectedAddons((prev) => {
                                  const c = prev[p.id] || 0;
                                  const n = Math.max(0, c - 1);
                                  if (n === 0) { const { [p.id]: _, ...rest } = prev; return rest; }
                                  return { ...prev, [p.id]: n };
                                })
                              }
                              className="w-6 h-6 flex items-center justify-center text-primary font-bold"
                            >−</button>
                            <span className="text-[13px] font-bold text-foreground tabular-nums">{qty}</span>
                            <button
                              onClick={() => setSelectedAddons((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                              className="w-6 h-6 flex items-center justify-center text-primary font-bold"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedAddons((prev) => ({ ...prev, [p.id]: 1 }))}
                            className="mt-1 h-8 rounded-[4px] border border-primary text-primary text-[13px] font-bold tracking-wide uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <span className="text-foreground">{f.displayName} × {f.qty}</span>
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

              {selectedAddonsList.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Add-ons</h3>
                  {selectedAddonsList.map((a) => (
                    <div key={a.id} className="flex justify-between items-center py-1.5 text-sm">
                      <span className="text-foreground">{a.name} × {a.qty}</span>
                      <span className="text-muted-foreground">{formatPrice(Number(a.price) * a.qty)}</span>
                    </div>
                  ))}
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

              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-foreground font-medium">Bouquet Making Charge</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Hand arrangement, decoration & premium packaging</p>
                  </div>
                  <span className="text-muted-foreground font-medium">{formatPrice(MAKING_CHARGE)}</span>
                </div>
                {designCharge > 0 && (
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                    <div>
                      <span className="text-foreground font-medium">Designer Service</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Custom design crafted from your photo</p>
                    </div>
                    <span className="text-muted-foreground font-medium">{formatPrice(designCharge)}</span>
                  </div>
                )}
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
