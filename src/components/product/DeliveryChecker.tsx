import { useEffect, useState, useMemo } from "react";
import { MapPin, Check, X, Rocket, Package, Shield, Truck } from "lucide-react";
import {
  useDeliveryModes,
  useDeliveryCities,
  useCategoryDeliveryModes,
  modeCharge,
  resolveModeForCity,
  effectiveCharge,
} from "@/hooks/useDeliveryModes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ICONS: Record<string, any> = { rocket: Rocket, package: Package, shield: Shield, truck: Truck };
const STORAGE_KEY = "pikooly_delivery_city";

interface Props {
  productId?: string;
  categoryId?: string | null;
  product?: any;
}

const DeliveryChecker = ({ categoryId }: Props) => {
  const { data: modes = [] } = useDeliveryModes();
  const { data: cities = [] } = useDeliveryCities();
  const { data: catModes = [] } = useCategoryDeliveryModes();
  const [selectedCity, setSelectedCity] = useState<string>(
    () => (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || ""
  );

  useEffect(() => {
    if (selectedCity) localStorage.setItem(STORAGE_KEY, selectedCity);
  }, [selectedCity]);

  const activeModes = modes.filter((m) => m.is_active);
  const cityList = useMemo(
    () => Array.from(new Set(cities.map((c) => c.city_name))).sort(),
    [cities]
  );

  // Determine which mode this product's category maps to (default Standard fallback)
  const mapping = useMemo(() => catModes.find((cm) => cm.category_id === categoryId), [catModes, categoryId]);
  const productMode = useMemo(() => {
    if (mapping) {
      const m = activeModes.find((a) => a.id === mapping.mode_id);
      if (m) return m;
    }
    return activeModes.find((m) => m.key === "standard") || activeModes[0];
  }, [mapping, activeModes]);

  const fallbackMode = useMemo(
    () => (mapping?.fallback_mode_id ? activeModes.find((m) => m.id === mapping.fallback_mode_id) : undefined),
    [mapping, activeModes]
  );

  if (!productMode) return null;

  const fastCities = cities
    .filter((c) => c.mode_id === productMode.id)
    .map((c) => c.city_name);

  // Resolve based on customer's city: primary if city qualifies, else fallback (if set), else primary.
  const resolvedMode =
    resolveModeForCity(productMode, fallbackMode, selectedCity || undefined, fastCities) || productMode;

  const fastAvailable =
    productMode.key === "fast" &&
    !!selectedCity &&
    selectedCity !== "__other__" &&
    fastCities.includes(selectedCity);

  const Icon = ICONS[resolvedMode.icon || "truck"] || Truck;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Check Delivery Availability</span>
      </div>

      <Select value={selectedCity || undefined} onValueChange={setSelectedCity}>
        <SelectTrigger className="h-11 bg-background text-base">
          <SelectValue placeholder="Select your city / district" />
        </SelectTrigger>
        <SelectContent>
          {cityList.length === 0 ? (
            <SelectItem value="none" disabled>No cities configured</SelectItem>
          ) : (
            cityList.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))
          )}
          <SelectItem value="__other__">Other district (Bangladesh)</SelectItem>
        </SelectContent>
      </Select>

      {selectedCity && (
        <div className="rounded-lg bg-background border border-border p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <p className="font-semibold text-sm">{resolvedMode.name} available</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resolvedMode.delivery_time}
              {selectedCity !== "__other__" && ` · ${selectedCity}`}
            </p>
            {resolvedMode.badge_text && (
              <p className="text-[11px] text-primary font-medium mt-1">{resolvedMode.badge_text}</p>
            )}
          </div>
          <p className="text-base font-bold text-primary tabular-nums shrink-0">
            ৳{modeCharge(resolvedMode)}
          </p>
        </div>
      )}

      {selectedCity && productMode.key === "fast" && !fastAvailable && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <X className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          Fast Delivery not available in {selectedCity === "__other__" ? "this area" : selectedCity}.
          {fallbackMode ? ` ${fallbackMode.name} shown above.` : " Primary charge shown above."}
        </p>
      )}
    </div>
  );
};

export default DeliveryChecker;
