import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Package, Shield, Save, Plus, X, Truck } from "lucide-react";
import {
  useDeliveryModes,
  useDeliveryCities,
  useCategoryDeliveryModes,
  type DeliveryMode,
} from "@/hooks/useDeliveryModes";

const ICONS: Record<string, any> = { rocket: Rocket, package: Package, shield: Shield, truck: Truck };

const AdminShipping = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: modes = [] } = useDeliveryModes();
  const { data: cities = [] } = useDeliveryCities();
  const { data: catModes = [] } = useCategoryDeliveryModes();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-delivery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [drafts, setDrafts] = useState<Record<string, Partial<DeliveryMode>>>({});
  useEffect(() => {
    const seed: Record<string, Partial<DeliveryMode>> = {};
    modes.forEach((m) => (seed[m.id] = { ...m }));
    setDrafts(seed);
  }, [modes]);

  const [newCity, setNewCity] = useState<Record<string, string>>({});

  const updateMode = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    const { error } = await supabase
      .from("delivery_modes")
      .update({
        name: d.name,
        delivery_time: d.delivery_time,
        badge_text: d.badge_text,
        flat_charge: Number(d.flat_charge ?? 0),
        min_charge: Number(d.min_charge ?? 0),
        max_charge: Number(d.max_charge ?? 0),
        is_active: d.is_active,
      })
      .eq("id", id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Saved" });
      qc.invalidateQueries({ queryKey: ["delivery-modes"] });
    }
  };

  const addCity = async (modeId: string) => {
    const name = (newCity[modeId] || "").trim();
    if (!name) return;
    const { error } = await supabase.from("delivery_mode_cities").insert({ mode_id: modeId, city_name: name });
    if (error) toast({ title: "Add failed", description: error.message, variant: "destructive" });
    else {
      setNewCity((p) => ({ ...p, [modeId]: "" }));
      qc.invalidateQueries({ queryKey: ["delivery-mode-cities"] });
    }
  };

  const removeCity = async (id: string) => {
    await supabase.from("delivery_mode_cities").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["delivery-mode-cities"] });
  };

  const assignCategory = async (categoryId: string, modeId: string, fallbackModeId?: string | null) => {
    const existing = catModes.find((c) => c.category_id === categoryId);
    const payload: any = { mode_id: modeId };
    if (fallbackModeId !== undefined) payload.fallback_mode_id = fallbackModeId;
    if (existing) {
      await supabase.from("category_delivery_modes").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("category_delivery_modes").insert({ category_id: categoryId, ...payload });
    }
    qc.invalidateQueries({ queryKey: ["category-delivery-modes"] });
    toast({ title: "Updated" });
  };

  const citiesByMode = useMemo(() => {
    const m: Record<string, typeof cities> = {};
    cities.forEach((c) => {
      (m[c.mode_id] ||= [] as any).push(c);
    });
    return m;
  }, [cities]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Delivery & Shipping</h1>
        <p className="text-sm text-muted-foreground">
          Manage your 3 delivery modes, cities, and category assignments.
        </p>
      </div>

      {/* DELIVERY MODES */}
      <div className="space-y-4">
        {modes.map((m) => {
          const Icon = ICONS[m.icon || "truck"] || Truck;
          const d = drafts[m.id] || {};
          const modeCities = citiesByMode[m.id] || [];
          return (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{m.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Active</Label>
                  <Switch
                    checked={!!d.is_active}
                    onCheckedChange={(v) => setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], is_active: v } }))}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Display name</Label>
                    <Input
                      value={d.name || ""}
                      onChange={(e) => setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], name: e.target.value } }))}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Delivery time text</Label>
                    <Input
                      value={d.delivery_time || ""}
                      placeholder="e.g. 2-3 Hours"
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], delivery_time: e.target.value } }))
                      }
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  {m.charge_type === "flat" ? (
                    <div>
                      <Label className="text-xs">Flat charge (৳)</Label>
                      <Input
                        type="number"
                        value={d.flat_charge ?? 0}
                        onChange={(e) =>
                          setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], flat_charge: Number(e.target.value) } }))
                        }
                        style={{ fontSize: 16 }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      <div>
                        <Label className="text-xs">Min charge (৳)</Label>
                        <Input
                          type="number"
                          value={d.min_charge ?? 0}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], min_charge: Number(e.target.value) } }))
                          }
                          style={{ fontSize: 16 }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max charge (৳)</Label>
                        <Input
                          type="number"
                          value={d.max_charge ?? 0}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], max_charge: Number(e.target.value) } }))
                          }
                          style={{ fontSize: 16 }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Badge text (optional)</Label>
                    <Input
                      value={d.badge_text || ""}
                      placeholder="e.g. Protected Packaging Included"
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], badge_text: e.target.value } }))
                      }
                      style={{ fontSize: 16 }}
                    />
                  </div>
                </div>

                {/* Cities (only for fast/range modes that have city restrictions) */}
                {m.key === "fast" && (
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Available cities</Label>
                      <span className="text-xs text-muted-foreground">{modeCities.length} cities</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {modeCities.map((c) => (
                        <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                          {c.city_name}
                          <button
                            onClick={() => removeCity(c.id)}
                            className="hover:bg-destructive/20 rounded p-0.5"
                            aria-label={`Remove ${c.city_name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {modeCities.length === 0 && (
                        <p className="text-xs text-muted-foreground">No cities yet — add below.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add city name"
                        value={newCity[m.id] || ""}
                        onChange={(e) => setNewCity((p) => ({ ...p, [m.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addCity(m.id)}
                        style={{ fontSize: 16 }}
                      />
                      <Button size="sm" onClick={() => addCity(m.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={() => updateMode(m.id)} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" /> Save changes
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CATEGORY ASSIGNMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category → Delivery Mode</CardTitle>
          <p className="text-xs text-muted-foreground">
            Assign each category to a delivery mode. Customers see split shipments when cart mixes modes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {categories.map((c: any) => {
              const current = catModes.find((cm) => cm.category_id === c.id)?.mode_id || "";
              return (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{c.name}</span>
                  <div className="w-48">
                    <Select value={current || "none"} onValueChange={(v) => v !== "none" && assignCategory(c.id, v)}>
                      <SelectTrigger style={{ fontSize: 16 }}>
                        <SelectValue placeholder="— select —" />
                      </SelectTrigger>
                      <SelectContent>
                        {modes.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No categories found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShipping;
