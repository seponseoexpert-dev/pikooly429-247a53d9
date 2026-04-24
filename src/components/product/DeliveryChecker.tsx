import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Zap, Calendar, Truck, CheckCircle2 } from "lucide-react";
import { resolveDelivery, type ResolvedDelivery } from "@/lib/deliveryResolver";

interface District {
  id: string;
  name: string;
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
}

const STORAGE_KEY = "preferred_delivery_district";

const DeliveryChecker = ({ product }: Props) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [resolved, setResolved] = useState<ResolvedDelivery | null>(null);

  useEffect(() => {
    supabase
      .from("shipping_districts")
      .select("id,name,delivery_fee,same_day_fee,next_day_fee")
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
    }
    const r = resolveDelivery(product, selected, {
      delivery_fee: district.delivery_fee,
      same_day_fee: district.same_day_fee,
      next_day_fee: district.next_day_fee,
    });
    setResolved(r);
  }, [selected, districts, product]);

  const Icon = resolved?.speed === "same_day" ? Zap : resolved?.speed === "next_day" ? Calendar : Truck;
  const tone =
    resolved?.speed === "same_day"
      ? "from-[hsl(28_95%_55%)] to-[hsl(14_92%_52%)]"
      : resolved?.speed === "next_day"
      ? "from-[hsl(220_85%_56%)] to-[hsl(245_82%_58%)]"
      : "from-[hsl(0_0%_30%)] to-[hsl(0_0%_18%)]";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Check Delivery Availability</h3>
      </div>

      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full text-base">
          <SelectValue placeholder="Select your district / city" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {districts.length === 0 ? (
            <SelectItem value="none" disabled>No districts available</SelectItem>
          ) : (
            districts.map((d) => (
              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {resolved && (
        <div className={`rounded-lg p-3 text-white bg-gradient-to-br ${tone} shadow-sm`}>
          <div className="flex items-start gap-2.5">
            <Icon className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <p className="text-sm font-bold">{resolved.label}</p>
              </div>
              <p className="text-xs mt-0.5 opacity-95">
                Estimated: <strong>{resolved.eta}</strong>
              </p>
              <p className="text-xs mt-0.5 opacity-95">
                Delivery Fee: <strong>{resolved.feeLabel}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {!resolved && (
        <p className="text-xs text-muted-foreground">
          Select a district to see exact delivery time and fee.
        </p>
      )}
    </div>
  );
};

export default DeliveryChecker;
