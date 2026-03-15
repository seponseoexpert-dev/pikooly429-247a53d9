import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, Link } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Flower2, Package, Ruler, MessageSquare, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Choose Flowers", icon: Flower2 },
  { id: 2, label: "Choose Materials", icon: Package },
  { id: 3, label: "Choose Size", icon: Ruler },
  { id: 4, label: "Review & Order", icon: MessageSquare },
];

const BouquetBuilder = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useMultiCurrency();
  const [step, setStep] = useState(1);
  const [selectedFlowers, setSelectedFlowers] = useState<Record<string, number>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState("");

  const { data: flowers = [] } = useQuery({
    queryKey: ["bouquet-flowers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bouquet_flowers").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["bouquet-materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bouquet_materials").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["bouquet-sizes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bouquet_sizes").select("*").eq("is_active", true).order("display_order");
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

  const materialItem = materials.find((m: any) => m.id === selectedMaterial);
  const sizeItem = sizes.find((s: any) => s.id === selectedSize);

  const totalPrice = useMemo(() => {
    let total = 0;
    selectedFlowersList.forEach((f) => { total += f.price * f.qty; });
    if (materialItem) total += Number(materialItem.price);
    if (sizeItem) total += Number(sizeItem.extra_price);
    return total;
  }, [selectedFlowersList, materialItem, sizeItem]);

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

  const canProceed = () => {
    if (step === 1) return selectedFlowersList.length > 0;
    if (step === 2) return !!selectedMaterial;
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

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
      {/* Breadcrumb */}
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
            const Icon = s.icon;
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
                      <img
                        src={flower.image_url || "/placeholder.svg"}
                        alt={flower.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
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
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Materials</h2>
            <p className="text-sm text-muted-foreground mb-6">Select wrapping & packaging</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {materials.map((mat: any) => {
                const isSelected = selectedMaterial === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat.id)}
                    className={cn(
                      "relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-card",
                      isSelected ? "border-primary shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="aspect-square bg-secondary/20 overflow-hidden">
                      <img src={mat.image_url || "/placeholder.svg"} alt={mat.name} className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1">{mat.name}</h3>
                      <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(mat.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">Choose Size</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick your bouquet size</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sizes.map((size: any) => {
                const isSelected = selectedSize === size.id;
                return (
                  <div
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={cn(
                      "rounded-xl border-2 p-5 cursor-pointer transition-all bg-card",
                      isSelected ? "border-primary shadow-md bg-primary/5" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{size.name}</h3>
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    {size.description && <p className="text-sm text-muted-foreground mb-2">{size.description}</p>}
                    <p className="text-primary font-bold">
                      {Number(size.extra_price) > 0 ? `+ ${formatPrice(size.extra_price)}` : "No extra charge"}
                    </p>
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
              {/* Flowers summary */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Flower2 className="h-4 w-4 text-primary" /> Flowers</h3>
                {selectedFlowersList.map((f) => (
                  <div key={f.id} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-foreground">{f.name} × {f.qty}</span>
                    <span className="text-muted-foreground">{formatPrice(f.price * f.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Material summary */}
              {materialItem && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Wrapping</h3>
                  <div className="flex justify-between text-sm">
                    <span>{materialItem.name}</span>
                    <span className="text-muted-foreground">{formatPrice(materialItem.price)}</span>
                  </div>
                </div>
              )}

              {/* Size summary */}
              {sizeItem && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Size</h3>
                  <div className="flex justify-between text-sm">
                    <span>{sizeItem.name}</span>
                    <span className="text-muted-foreground">
                      {Number(sizeItem.extra_price) > 0 ? `+ ${formatPrice(sizeItem.extra_price)}` : "Free"}
                    </span>
                  </div>
                </div>
              )}

              {/* Gift Message */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Gift Message (Optional)</h3>
                <Textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Write a personal message for the recipient..."
                  rows={3}
                />
              </div>

              {/* Total */}
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
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="text-sm font-semibold text-primary">
          {totalPrice > 0 && `Total: ${formatPrice(totalPrice)}`}
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
