import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryMode {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  badge_text: string | null;
  delivery_time: string;
  charge_type: "flat" | "range";
  flat_charge: number;
  min_charge: number;
  max_charge: number;
  is_active: boolean;
  sort_order: number;
}

export interface DeliveryModeCity {
  id: string;
  mode_id: string;
  city_name: string;
  thana?: string | null;
  charge_override?: number | null;
}

export interface CategoryDeliveryMode {
  id: string;
  category_id: string;
  mode_id: string;
  fallback_mode_id?: string | null;
}

/**
 * Resolve which delivery mode applies for a customer's selected city.
 * - If primary mode has a city list AND the selected city is NOT in it AND a fallback exists → use fallback.
 * - Otherwise → use primary.
 */
export const resolveModeForCity = (
  primary: DeliveryMode | undefined,
  fallback: DeliveryMode | undefined,
  selectedCity: string | undefined,
  citiesForPrimary: string[]
): DeliveryMode | undefined => {
  if (!primary) return fallback;
  if (!fallback) return primary;
  const isRestricted = citiesForPrimary.length > 0;
  if (!isRestricted) return primary;
  if (!selectedCity || selectedCity === "__other__") return fallback;
  return citiesForPrimary.includes(selectedCity) ? primary : fallback;
};

/** Effective base charge for a mode (flat → flat_charge, range → min_charge as shown to customer). */
export const modeCharge = (m: Pick<DeliveryMode, "charge_type" | "flat_charge" | "min_charge">) =>
  m.charge_type === "flat" ? Number(m.flat_charge || 0) : Number(m.min_charge || 0);

/** Effective charge for a mode + city. If a city row has a charge_override, that wins. */
export const effectiveCharge = (
  mode: DeliveryMode,
  cityRows: DeliveryModeCity[],
  selectedCity?: string | null
): number => {
  if (selectedCity && selectedCity !== "__other__") {
    const row = cityRows.find(
      (c) => c.mode_id === mode.id && c.city_name === selectedCity && c.charge_override != null
    );
    if (row && row.charge_override != null) return Number(row.charge_override);
  }
  return modeCharge(mode);
};

export const useDeliveryModes = () =>
  useQuery({
    queryKey: ["delivery-modes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_modes")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as DeliveryMode[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useDeliveryCities = () =>
  useQuery({
    queryKey: ["delivery-mode-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_mode_cities").select("*");
      if (error) throw error;
      return (data || []) as DeliveryModeCity[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCategoryDeliveryModes = () =>
  useQuery({
    queryKey: ["category-delivery-modes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("category_delivery_modes").select("*");
      if (error) throw error;
      return (data || []) as CategoryDeliveryMode[];
    },
    staleTime: 5 * 60 * 1000,
  });
