import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useDeliveryModes,
  useDeliveryCities,
  useCategoryDeliveryModes,
  modeCharge,
  resolveModeForCity,
  effectiveCharge,
  type DeliveryMode,
} from "@/hooks/useDeliveryModes";

const CITY_STORAGE_KEY = "pikooly_delivery_city";

export interface DeliveryGroup {
  mode: DeliveryMode;
  productIds: string[];
  productNames: string[];
  charge: number;
}

interface CartItemLike {
  product: { id: string; name: string; categoryId?: string | null };
}

/**
 * Splits cart items into delivery groups based on each product's category → delivery mode.
 * Each unique mode = one shipment with its own charge.
 */
export const useCheckoutDelivery = (items: CartItemLike[], cityOverride?: string) => {
  const { data: modes = [] } = useDeliveryModes();
  const { data: cities = [] } = useDeliveryCities();
  const { data: catModes = [] } = useCategoryDeliveryModes();

  const selectedCity =
    cityOverride ?? (typeof window !== "undefined" ? localStorage.getItem(CITY_STORAGE_KEY) || undefined : undefined);

  // Resolve each cart product's category_id (if not already on the cart item)
  const productIds = items.map((i) => i.product.id).filter((id) => !id.startsWith("bouquet-"));
  const { data: productCats = [] } = useQuery({
    queryKey: ["checkout-prod-cats", productIds.sort().join(",")],
    queryFn: async () => {
      if (!productIds.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, category_id")
        .in("id", productIds);
      if (error) throw error;
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const groups = useMemo<DeliveryGroup[]>(() => {
    if (!modes.length || !items.length) return [];
    const activeModes = modes.filter((m) => m.is_active);
    const defaultMode = activeModes.find((m) => m.key === "standard") || activeModes[0];
    if (!defaultMode) return [];

    const catLookup = new Map(catModes.map((cm) => [cm.category_id, cm]));
    const productCatLookup = new Map(productCats.map((p) => [p.id, p.category_id]));

    const byMode = new Map<string, DeliveryGroup>();

    items.forEach((item) => {
      const catId =
        (item.product as any).categoryId ||
        (item.product as any).category_id ||
        productCatLookup.get(item.product.id) ||
        null;
      const mapping = catId ? catLookup.get(catId) : null;
      const primary = mapping ? activeModes.find((m) => m.id === mapping.mode_id) : undefined;
      const fb = mapping?.fallback_mode_id ? activeModes.find((m) => m.id === mapping.fallback_mode_id) : undefined;
      const citiesForPrimary = primary
        ? cities.filter((c) => c.mode_id === primary.id).map((c) => c.city_name)
        : [];
      const mode =
        resolveModeForCity(primary, fb, selectedCity, citiesForPrimary) || defaultMode;
      const key = mode.id;
      if (!byMode.has(key)) {
        byMode.set(key, { mode, productIds: [], productNames: [], charge: modeCharge(mode) });
      }
      const g = byMode.get(key)!;
      g.productIds.push(item.product.id);
      g.productNames.push(item.product.name);
    });

    return Array.from(byMode.values()).sort((a, b) => a.mode.sort_order - b.mode.sort_order);
  }, [modes, cities, catModes, productCats, items, selectedCity]);

  const totalDeliveryFee = groups.reduce((s, g) => s + g.charge, 0);
  const isSplit = groups.length > 1;
  const primaryLabel = groups.map((g) => g.mode.name).join(" + ");

  return { groups, totalDeliveryFee, isSplit, primaryLabel };
};
