import { Rocket, Package, Shield, Truck, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DeliveryGroup } from "@/hooks/useCheckoutDelivery";

const ICONS: Record<string, any> = { rocket: Rocket, package: Package, shield: Shield, truck: Truck };

interface Props {
  groups: DeliveryGroup[];
  formatPrice: (n: number) => string;
}

const DeliveryModeCards = ({ groups, formatPrice }: Props) => {
  if (!groups.length) return null;
  const isSplit = groups.length > 1;

  return (
    <div className="space-y-3">
      {isSplit && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Split shipment</p>
            <p className="text-muted-foreground">
              Your order ships in {groups.length} parts based on item type. Charges shown per shipment.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const Icon = ICONS[g.mode.icon || "truck"] || Truck;
          return (
            <Card
              key={g.mode.id}
              className={cn(
                "relative overflow-hidden p-3.5 border-2 border-primary/40 bg-primary/5",
                "transition-all hover:shadow-md"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 border">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{g.mode.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{g.mode.delivery_time}</p>
                  {g.mode.badge_text && (
                    <p className="mt-1 text-[10px] inline-block bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                      {g.mode.badge_text}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-base text-primary tabular-nums">৳{g.charge}</p>
                </div>
              </div>
              {isSplit && (
                <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
                  {g.productNames.length} item{g.productNames.length > 1 ? "s" : ""}: {g.productNames.join(", ")}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryModeCards;
