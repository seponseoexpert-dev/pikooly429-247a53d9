import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Zap, Calendar, Truck, CheckCircle2, Search, Bike, Car, Package } from "lucide-react";
import { resolveDelivery, resolveEffectiveDeliveryFees, type CategoryDeliveryFee, type ResolvedDelivery } from "@/lib/deliveryResolver";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

interface District {
  id: string;
  name: string;
  postal_code: string | null;
  delivery_fee: number;
  same_day_fee: number | null;
  next_day_fee: number | null;
}

interface Props {
  product: {
    same_day_districts?: string[] | null;
    next_day_districts?: string[] | null;
    standard_delivery_days?: number | null;
  };
  productId?: string;
  categoryId?: string | null;
}

const STORAGE_KEY = "preferred_delivery_district";

const DeliveryChecker = ({ product, productId, categoryId }: Props) => {
  const { formatPrice } = useMultiCurrency();
  const [districts, setDistricts] = useState<District[]>([]);
  const [categoryFees, setCategoryFees] = useState<CategoryDeliveryFee[]>([]);
  const [productCategoryIds, setProductCategoryIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [resolved, setResolved] = useState<ResolvedDelivery | null>(null);
  const [search, setSearch] = useState("");

  const filteredDistricts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.postal_code || "").toLowerCase().includes(q)
    );
  }, [districts, search]);

  useEffect(() => {
    supabase
      .from("shipping_districts")
      .select("id,name,postal_code,delivery_fee,same_day_fee,next_day_fee")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) {
          setDistricts(data as District[]);
          // Auto-pick last used district from localStorage
          const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          if (saved && data.some((d) => d.name === saved)) {
            setSelected(saved);
          }
        }
      });
  }, []);

  // Category delivery fees are tied to the product's primary category only.
  // Extra browsing/category links must not change the delivery charge.
  useEffect(() => {
    if (categoryId || !productId) {
      setProductCategoryIds(categoryId ? [categoryId] : []);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("category_id")
        .eq("id", productId)
        .maybeSingle();
      if (!active) return;
      setProductCategoryIds(data?.category_id ? [data.category_id] : []);
    })();
    return () => { active = false; };
  }, [productId, categoryId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("shipping_category_fees")
        .select("district_id, category_id, delivery_fee, same_day_fee, next_day_fee");
      if (!active) return;
      setCategoryFees(data || []);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) {
      setResolved(null);
      return;
    }
    const district = districts.find((d) => d.name === selected);
    if (!district) {
      setResolved(null);
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, selected);
      window.dispatchEvent(new Event("delivery-district-changed"));
    }

    const effectiveFees = resolveEffectiveDeliveryFees(district, categoryFees, productCategoryIds);

    const r = resolveDelivery(product, selected, effectiveFees);
    setResolved(r);
  }, [selected, districts, product, productCategoryIds, categoryFees]);

  const Icon = resolved?.speed === "same_day" ? Zap : resolved?.speed === "next_day" ? Calendar : Truck;
  const tone =
    resolved?.speed === "same_day"
      ? "from-[hsl(28_95%_55%)] to-[hsl(14_92%_52%)]"
      : resolved?.speed === "next_day"
      ? "from-[hsl(220_85%_56%)] to-[hsl(245_82%_58%)]"
      : "from-[hsl(0_0%_30%)] to-[hsl(0_0%_18%)]";

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[13px] font-semibold">Gift Receiver's Location</h3>
      </div>

      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full text-sm h-9">
          <SelectValue placeholder="Select your district / city" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="sticky top-0 z-10 bg-popover p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search district or postal code..."
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
          {districts.length === 0 ? (
            <SelectItem value="none" disabled>No districts available</SelectItem>
          ) : filteredDistricts.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No matches for "{search}"
            </div>
          ) : (
            filteredDistricts.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                <span className="flex items-center gap-2">
                  <span>{d.name}</span>
                  {d.postal_code && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {d.postal_code}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {resolved && (
        <div className="space-y-2">
          {/* Compact gradient banner — only label + ETA + Fee */}
          <div className={`rounded-lg p-2.5 text-white bg-gradient-to-br ${tone} shadow-sm ring-1 ring-white/20`}>
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <p className="text-[13px] font-bold leading-tight">{resolved.label}</p>
                </div>
                <p className="text-[11px] mt-0.5 opacity-95 leading-snug">
                  Estimated: <strong>{resolved.eta}</strong>
                </p>
                <p className="text-[11px] opacity-95 leading-snug">
                  Delivery Fee: <strong>{formatPrice(resolved.fee)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Delivery method — seamless continuation, no separate box */}
          {resolved.speed === "same_day" && (
            <div className="px-0.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-semibold">
                Delivered via
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-foreground">
                  <Bike className="h-2.5 w-2.5" /> Bike
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-foreground">
                  <Truck className="h-2.5 w-2.5" /> CNG
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-foreground">
                  <Car className="h-2.5 w-2.5" /> Private Car
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">
                  + Others
                </span>
              </div>
            </div>
          )}

          {(resolved.speed === "next_day" || resolved.speed === "standard") && (
            <div className="px-0.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-semibold">
                Shipped via courier
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-foreground">
                  <Package className="h-2.5 w-2.5" /> Pathao
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-foreground">
                  <Package className="h-2.5 w-2.5" /> SteadFast
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">
                  + Other Couriers
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!resolved && (
        <p className="text-xs text-muted-foreground">
          Select a district to see exact delivery time, fee, and how it'll be delivered.
        </p>
      )}
    </div>
  );
};

export default DeliveryChecker;
