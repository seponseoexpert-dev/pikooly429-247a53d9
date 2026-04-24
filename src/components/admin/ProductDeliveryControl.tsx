import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Calendar, Truck } from "lucide-react";

interface District {
  id: string;
  name: string;
  is_active: boolean;
}

interface Props {
  sameDayDistricts: string[];
  nextDayDistricts: string[];
  standardDeliveryDays: number;
  onChange: (next: {
    same_day_districts: string[];
    next_day_districts: string[];
    standard_delivery_days: number;
  }) => void;
}

/**
 * Admin form section that lets you configure per-product delivery options.
 *  - SameDay districts (multi-select)
 *  - Next Day districts (multi-select)
 *  - Standard delivery days (number, fallback for everywhere else)
 */
const ProductDeliveryControl = ({
  sameDayDistricts,
  nextDayDistricts,
  standardDeliveryDays,
  onChange,
}: Props) => {
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    supabase
      .from("shipping_districts")
      .select("id,name,is_active")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setDistricts(data as District[]);
      });
  }, []);

  const toggle = (
    list: string[],
    name: string,
    key: "same_day_districts" | "next_day_districts"
  ) => {
    const next = list.includes(name)
      ? list.filter((n) => n !== name)
      : [...list, name];
    onChange({
      same_day_districts:
        key === "same_day_districts" ? next : sameDayDistricts,
      next_day_districts:
        key === "next_day_districts" ? next : nextDayDistricts,
      standard_delivery_days: standardDeliveryDays,
    });
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Delivery Options (per product)</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Select districts where this product can be delivered Same Day or Next
        Day. All other districts will use Standard Delivery.
      </p>

      {/* Same Day Districts */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Zap className="h-3.5 w-3.5 text-[hsl(20_92%_52%)]" />
          Same Day Delivery — Available Districts
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border rounded-md p-3 max-h-44 overflow-y-auto bg-background">
          {districts.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-full">
              No active districts found. Add districts in Shipping settings.
            </p>
          )}
          {districts.map((d) => (
            <label
              key={`sd-${d.id}`}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
            >
              <Checkbox
                checked={sameDayDistricts.includes(d.name)}
                onCheckedChange={() =>
                  toggle(sameDayDistricts, d.name, "same_day_districts")
                }
              />
              <span className="text-xs">{d.name}</span>
            </label>
          ))}
        </div>
        {sameDayDistricts.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {sameDayDistricts.length} district(s) selected
          </p>
        )}
      </div>

      {/* Next Day Districts */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5 text-[hsl(220_85%_56%)]" />
          Next Day Delivery — Available Districts
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border rounded-md p-3 max-h-44 overflow-y-auto bg-background">
          {districts.map((d) => (
            <label
              key={`nd-${d.id}`}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
            >
              <Checkbox
                checked={nextDayDistricts.includes(d.name)}
                onCheckedChange={() =>
                  toggle(nextDayDistricts, d.name, "next_day_districts")
                }
              />
              <span className="text-xs">{d.name}</span>
            </label>
          ))}
        </div>
        {nextDayDistricts.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {nextDayDistricts.length} district(s) selected
          </p>
        )}
      </div>

      {/* Standard Delivery Days */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
          Standard Delivery Days (other districts)
        </Label>
        <Input
          type="number"
          min={1}
          max={30}
          value={standardDeliveryDays}
          onChange={(e) =>
            onChange({
              same_day_districts: sameDayDistricts,
              next_day_districts: nextDayDistricts,
              standard_delivery_days: parseInt(e.target.value) || 3,
            })
          }
          className="max-w-[120px]"
        />
        <p className="text-[11px] text-muted-foreground">
          For districts not selected above — e.g. <strong>3</strong> means
          "Delivery in 3 days".
        </p>
      </div>
    </div>
  );
};

export default ProductDeliveryControl;
