import { useEffect, useMemo, useState } from "react";
import { MapPin, Truck, Zap, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart, buildVariantKey } from "@/contexts/CartContext";
import { resolveDelivery, deliveryGroupLabel, type DeliverySpeed } from "@/lib/deliveryResolver";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const STORAGE_KEY = "preferred_delivery_district";

interface District {
  id: string;
  name: string;
  delivery_fee: number;
  same_day_fee: number | null;
  next_day_fee: number | null;
}

interface ProductDeliveryRow {
  id: string;
  same_day_districts: string[] | null;
  next_day_districts: string[] | null;
  standard_delivery_days: number | null;
}

const speedIcon = (s: DeliverySpeed) => {
  if (s === "same_day") return <Zap size={14} className="text-orange-600" />;
  if (s === "next_day") return <Calendar size={14} className="text-blue-600" />;
  return <Truck size={14} className="text-muted-foreground" />;
};

const speedAccent = (s: DeliverySpeed) => {
  if (s === "same_day") return "bg-orange-50 border-orange-200 text-orange-800";
  if (s === "next_day") return "bg-blue-50 border-blue-200 text-blue-800";
  return "bg-muted/60 border-border text-foreground";
};

const CartDeliveryGroups = ({ compact = false }: { compact?: boolean }) => {
  const { items } = useCart();
  const { formatPrice } = useMultiCurrency();
  const [districts, setDistricts] = useState<District[]>([]);
  const [productMap, setProductMap] = useState<Record<string, ProductDeliveryRow>>({});
  const [selected, setSelected] = useState<string>("");

  // Load districts
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("shipping_districts")
        .select("id,name,delivery_fee,same_day_fee,next_day_fee")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!active) return;
      const list = (data as District[]) || [];
      setDistricts(list);
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && list.find((d) => d.name === saved)) setSelected(saved);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load delivery config for cart products
  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.product.id))).filter(Boolean);
    if (!ids.length) {
      setProductMap({});
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,same_day_districts,next_day_districts,standard_delivery_days")
        .in("id", ids);
      if (!active) return;
      const map: Record<string, ProductDeliveryRow> = {};
      (data || []).forEach((p: any) => {
        map[p.id] = p;
      });
      setProductMap(map);
    })();
    return () => {
      active = false;
    };
  }, [items]);

  const handleSelect = (name: string) => {
    setSelected(name);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, name);
  };

  const district = districts.find((d) => d.name === selected);

  const groups = useMemo(() => {
    if (!district) return [];
    const buckets: Record<DeliverySpeed, { items: typeof items; fee: number }> = {
      same_day: { items: [], fee: Number(district.same_day_fee ?? district.delivery_fee ?? 0) },
      next_day: { items: [], fee: Number(district.next_day_fee ?? district.delivery_fee ?? 0) },
      standard: { items: [], fee: Number(district.delivery_fee ?? 0) },
    };
    items.forEach((it) => {
      const cfg = productMap[it.product.id] || {
        same_day_districts: [],
        next_day_districts: [],
        standard_delivery_days: 3,
      };
      const r = resolveDelivery(cfg, district.name, district);
      buckets[r.speed].items.push(it);
    });
    // Order: same -> next -> standard, only non-empty
    return (["same_day", "next_day", "standard"] as DeliverySpeed[])
      .filter((s) => buckets[s].items.length > 0)
      .map((s) => ({ speed: s, items: buckets[s].items, fee: buckets[s].fee }));
  }, [items, productMap, district]);

  if (!items.length) return null;

  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-3" : "p-4"} space-y-3`}>
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Delivery Location</p>
      </div>

      <Select value={selected || undefined} onValueChange={handleSelect}>
        <SelectTrigger className="h-11 text-sm">
          <SelectValue placeholder="Select your district to see delivery options" />
        </SelectTrigger>
        <SelectContent className="max-h-64 z-[80] bg-popover">
          {districts.map((d) => (
            <SelectItem key={d.id} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selected && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Info size={13} className="mt-0.5 shrink-0" />
          Select your district to see exact delivery time and fee for each item.
        </p>
      )}

      {selected && groups.length > 1 && (
        <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Your order will arrive in <b>{groups.length} separate deliveries</b> based on each item's
            availability in <b>{selected}</b>.
          </span>
        </div>
      )}

      {selected &&
        groups.map((g) => (
          <div key={g.speed} className={`rounded-xl border p-3 ${speedAccent(g.speed)}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                {speedIcon(g.speed)}
                <p className="text-xs font-bold uppercase tracking-wide">
                  {deliveryGroupLabel(g.speed)}
                </p>
              </div>
              <span className="text-xs font-bold tabular-nums">
                {formatPrice(g.fee)}
              </span>
            </div>
            <ul className="space-y-1 pl-1">
              {g.items.map((it) => (
                <li
                  key={`${it.product.id}-${buildVariantKey(it.variant)}`}
                  className="text-xs text-foreground/80 flex items-center justify-between gap-2"
                >
                  <span className="line-clamp-1">
                    {it.product.name}
                    {it.variant?.size ? ` · ${it.variant.size.name}` : ""}
                  </span>
                  <span className="text-muted-foreground shrink-0">× {it.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
};

export default CartDeliveryGroups;
