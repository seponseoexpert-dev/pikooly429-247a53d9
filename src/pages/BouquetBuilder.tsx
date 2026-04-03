import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, Link } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Flower2, Upload, Ruler, MessageSquare, ShoppingCart, ImagePlus, X } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Choose Flowers", icon: Flower2 },
  { id: 2, label: "Upload Design", icon: Upload },
  { id: 3, label: "Choose Size", icon: Ruler },
  { id: 4, label: "Review & Order", icon: MessageSquare },
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
  const [giftMessage, setGiftMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: flowers = [] } = useQuery({
    queryKey: ["bouquet-flowers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bouquet_flowers").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const selectedFlowersList = useMemo(() => {
    return Object.entries(selectedFlowers)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const f = flowers.find((fl: any) => fl.id === id);
        return f ? { ...f, qty } : null;
      })
      .filter(Boolean) as any[];
  }, [selectedFlowers, flowers]);

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
    if (step === 3) return !!selectedSize;
    return true;
  };

  const handleOrder = () => {
    const bouquetName = `Custom Bouquet (${selectedFlowersList.map((f) => `${f.name} x${f.qty}`).join(", ")})`;
    addItem({
      id: `bouquet-${Date.now()}`,
      name: bouquetName,
      price: totalPrice,
      image: selectedFlowersList[0]?.image_url || "/placeholder.svg",
      category: "Custom Bouquet",
      inStock: true,
    }, undefined, true);
    navigate("/checkout");
  };

  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Custom Flower Bouquet Builder - Pikooly",
    "description": "Design your own custom flower bouquet online. Choose from fresh roses, lilies, sunflowers & more. Select size, add a gift message & get same-day delivery in Bangladesh.",
    "provider": {
      "@type": "Organization",
      "name": "Pikooly"
    },
    "areaServed": "Bangladesh",
    "url": `${window.location.origin}/custom-bouquet`
  };

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      <SEOHead
        title="Custom Flower Bouquet Builder | Design Your Own Bouquet - Pikooly"
        description="Create your perfect custom flower bouquet online at Pikooly. Choose from fresh roses, lilies, sunflowers & more. Pick your size, add a personal gift message, and enjoy same-day delivery across Bangladesh."
        canonical={`${window.location.origin}/custom-bouquet`}
        ogType="product"
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
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Your Flowers</h2>
            <p className="text-sm text-muted-foreground mb-6">Select the flowers you love</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {flowers.map((flower: any) => {
                const qty = selectedFlowers[flower.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={flower.id}
                    className={cn(
                      "relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-card",
                      isSelected ? "border-primary shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="aspect-square bg-secondary/20 overflow-hidden" onClick={() => toggleFlower(flower.id)}>
                      <img src={flower.image_url || "/placeholder.svg"} alt={flower.name} className="w-full h-full object-cover" loading="lazy" />
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
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Size</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick your bouquet size</p>
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
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Size</h3>
                  <span className="text-sm text-foreground">{selectedSizeItem.name} — {selectedSizeItem.description}</span>
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
    </main>
  );
};

export default BouquetBuilder;
