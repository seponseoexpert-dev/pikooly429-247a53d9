/**
 * Resolve which delivery speed is available for a product in a given district.
 * Used in Product detail "Check Delivery" widget and Cart grouping.
 */

export type DeliverySpeed = "same_day" | "next_day" | "standard";

export interface ResolvedDelivery {
  speed: DeliverySpeed;
  label: string;        // "Same Day Delivery"
  eta: string;          // "Today by 9 PM" / "Tomorrow" / "In 3 days"
  fee: number;          // delivery fee in BDT
  feeLabel: string;     // "৳80"
}

export interface ProductDeliveryConfig {
  same_day_districts?: string[] | null;
  next_day_districts?: string[] | null;
  standard_delivery_days?: number | null;
}

export interface DistrictFees {
  same_day_fee?: number | null;
  next_day_fee?: number | null;
  delivery_fee: number; // standard
}

/**
 * Pick the fastest available delivery speed for this product + district.
 * Priority: Same Day > Next Day > Standard.
 */
export function resolveDelivery(
  product: ProductDeliveryConfig,
  districtName: string,
  fees: DistrictFees
): ResolvedDelivery {
  const sameDay = product.same_day_districts ?? [];
  const nextDay = product.next_day_districts ?? [];
  const stdDays = product.standard_delivery_days ?? 3;

  if (sameDay.includes(districtName)) {
    return {
      speed: "same_day",
      label: "Same Day Delivery",
      eta: "Today (within 6-9 hours)",
      fee: Number(fees.same_day_fee ?? fees.delivery_fee ?? 0),
      feeLabel: `৳${Number(fees.same_day_fee ?? fees.delivery_fee ?? 0)}`,
    };
  }
  if (nextDay.includes(districtName)) {
    return {
      speed: "next_day",
      label: "Next Day Delivery",
      eta: "Tomorrow",
      fee: Number(fees.next_day_fee ?? fees.delivery_fee ?? 0),
      feeLabel: `৳${Number(fees.next_day_fee ?? fees.delivery_fee ?? 0)}`,
    };
  }
  return {
    speed: "standard",
    label: "Standard Delivery",
    eta: stdDays === 1 ? "In 1 day" : `In ${stdDays} days`,
    fee: Number(fees.delivery_fee ?? 0),
    feeLabel: `৳${Number(fees.delivery_fee ?? 0)}`,
  };
}

/**
 * Group key used by the cart so items with the same speed end up together.
 */
export function deliveryGroupKey(speed: DeliverySpeed): string {
  return speed;
}

export function deliveryGroupLabel(speed: DeliverySpeed): string {
  if (speed === "same_day") return "Same Day Delivery (Today)";
  if (speed === "next_day") return "Next Day Delivery (Tomorrow)";
  return "Standard Delivery";
}
