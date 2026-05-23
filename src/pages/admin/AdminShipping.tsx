import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const [newCity, setNewCity] = useState<Record<string, { name: string; thana: string; charge: string }>>({});
  const [cityDrafts, setCityDrafts] = useState<Record<string, { thana: string; charge: string }>>({});

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
    const draft = newCity[modeId] || { name: "", thana: "", charge: "" };
    const name = draft.name.trim();
    if (!name) return;
    const payload: any = { mode_id: modeId, city_name: name };
    if (draft.thana.trim()) payload.thana = draft.thana.trim();
    if (draft.charge.trim() !== "") payload.charge_override = Number(draft.charge);
    const { error } = await supabase.from("delivery_mode_cities").insert(payload);
    if (error) toast({ title: "Add failed", description: error.message, variant: "destructive" });
    else {
      setNewCity((p) => ({ ...p, [modeId]: { name: "", thana: "", charge: "" } }));
      qc.invalidateQueries({ queryKey: ["delivery-mode-cities"] });
    }
  };

  const saveCity = async (cityId: string) => {
    const d = cityDrafts[cityId];
    if (!d) return;
    const payload: any = {
      thana: d.thana.trim() || null,
      charge_override: d.charge.trim() === "" ? null : Number(d.charge),
    };
    const { error } = await supabase.from("delivery_mode_cities").update(payload).eq("id", cityId);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "City updated" });
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

                {/* Cities & thanas — supported on all modes (e.g. Fast = service area; Premium Safe = far-zone overrides) */}
                <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Available cities / thanas</Label>
                    <span className="text-xs text-muted-foreground">{modeCities.length} entries</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    Add cities (and optional thana) where this mode is available. Leave charge override empty to use the mode's default charge; set a value for far/special zones.
                  </p>

                  <div className="space-y-2">
                    {modeCities.map((c) => {
                      const draft = cityDrafts[c.id] ?? {
                        thana: c.thana || "",
                        charge: c.charge_override != null ? String(c.charge_override) : "",
                      };
                      return (
                        <div key={c.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1fr_100px_auto_auto] gap-2 items-center bg-background rounded-md border p-2">
                          <div className="text-sm font-medium truncate">{c.city_name}</div>
                          <Input
                            placeholder="Thana (optional)"
                            value={draft.thana}
                            onChange={(e) =>
                              setCityDrafts((p) => ({ ...p, [c.id]: { ...draft, thana: e.target.value } }))
                            }
                            className="h-9 col-span-2 sm:col-span-1"
                            style={{ fontSize: 16 }}
                          />
                          <Input
                            type="number"
                            placeholder="৳ override"
                            value={draft.charge}
                            onChange={(e) =>
                              setCityDrafts((p) => ({ ...p, [c.id]: { ...draft, charge: e.target.value } }))
                            }
                            className="h-9"
                            style={{ fontSize: 16 }}
                          />
                          <Button size="sm" variant="outline" onClick={() => saveCity(c.id)} className="h-9">
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCity(c.id)}
                            className="h-9 text-destructive hover:text-destructive"
                            aria-label={`Remove ${c.city_name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {modeCities.length === 0 && (
                      <p className="text-xs text-muted-foreground">No cities yet — add below.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_100px_auto] gap-2">
                    <Input
                      placeholder="City name"
                      value={(newCity[m.id]?.name) || ""}
                      onChange={(e) =>
                        setNewCity((p) => ({
                          ...p,
                          [m.id]: { name: e.target.value, thana: p[m.id]?.thana || "", charge: p[m.id]?.charge || "" },
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addCity(m.id)}
                      className="h-9"
                      style={{ fontSize: 16 }}
                    />
                    <Input
                      placeholder="Thana (optional)"
                      value={(newCity[m.id]?.thana) || ""}
                      onChange={(e) =>
                        setNewCity((p) => ({
                          ...p,
                          [m.id]: { name: p[m.id]?.name || "", thana: e.target.value, charge: p[m.id]?.charge || "" },
                        }))
                      }
                      className="h-9"
                      style={{ fontSize: 16 }}
                    />
                    <Input
                      type="number"
                      placeholder="৳ override"
                      value={(newCity[m.id]?.charge) || ""}
                      onChange={(e) =>
                        setNewCity((p) => ({
                          ...p,
                          [m.id]: { name: p[m.id]?.name || "", thana: p[m.id]?.thana || "", charge: e.target.value },
                        }))
                      }
                      className="h-9"
                      style={{ fontSize: 16 }}
                    />
                    <Button size="sm" onClick={() => addCity(m.id)} className="h-9">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>


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
            <strong>Primary</strong> applies when the customer's city qualifies (e.g. Fast Delivery cities).
            <strong> Fallback</strong> auto-applies for cities outside that list. Leave Fallback empty to always use Primary.
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {([
              ...categories.map((c: any) => ({ id: c.id, name: c.name, isVirtual: false })),
              { id: "00000000-0000-0000-0000-0000000b0001", name: "Custom Bouquet", isVirtual: true },
            ]).map((c: any) => {
              const row = catModes.find((cm) => cm.category_id === c.id);
              const current = row?.mode_id || "";
              const fallback = row?.fallback_mode_id || "";
              return (
                <div key={c.id} className="py-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-3">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {c.isVirtual && <Flower2 className="h-4 w-4 text-primary" />}
                    {c.name}
                    {c.isVirtual && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">(builder)</span>}
                  </span>
                  <div className="w-full sm:w-44">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Primary</Label>
                    <Select
                      value={current || "none"}
                      onValueChange={(v) => v !== "none" && assignCategory(c.id, v, fallback || null)}
                    >
                      <SelectTrigger style={{ fontSize: 16 }} className="h-9">
                        <SelectValue placeholder="— select —" />
                      </SelectTrigger>
                      <SelectContent>
                        {modes.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-44">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Fallback (other cities)</Label>
                    <Select
                      value={fallback || "none"}
                      onValueChange={(v) => current && assignCategory(c.id, current, v === "none" ? null : v)}
                      disabled={!current}
                    >
                      <SelectTrigger style={{ fontSize: 16 }} className="h-9">
                        <SelectValue placeholder="— none —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None (use Primary) —</SelectItem>
                        {modes.filter((m) => m.id !== current).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CUSTOM BOUQUET — DISTRICT DELIVERY SPEEDS */}
      <BouquetDistrictsCard />
    </div>
  );
};

// ---------------------------------------------------------------
// Custom Bouquet — district delivery speed manager
// Powers the Bouquet Builder's Same-Day / Next-Day / Standard badge logic.
// Reads & writes the `shipping_districts` table.
// ---------------------------------------------------------------
const BouquetDistrictsCard = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: districts = [] } = useQuery({
    queryKey: ["bouquet-shipping-districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_districts")
        .select("id, name, same_day_fee, next_day_fee, delivery_fee")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  type Row = { same_day_fee: string; next_day_fee: string; delivery_fee: string };
  const [drafts, setDrafts] = useState<Record<string, Row>>({});
  useEffect(() => {
    const seed: Record<string, Row> = {};
    districts.forEach((d: any) => {
      seed[d.id] = {
        same_day_fee: d.same_day_fee != null ? String(d.same_day_fee) : "",
        next_day_fee: d.next_day_fee != null ? String(d.next_day_fee) : "",
        delivery_fee: d.delivery_fee != null ? String(d.delivery_fee) : "",
      };
    });
    setDrafts(seed);
  }, [districts]);

  const [newRow, setNewRow] = useState({ name: "", same_day_fee: "", next_day_fee: "", delivery_fee: "" });
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () => districts.filter((d: any) => d.name.toLowerCase().includes(filter.toLowerCase())),
    [districts, filter]
  );

  const saveRow = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    const payload: any = {
      same_day_fee: d.same_day_fee.trim() === "" ? null : Number(d.same_day_fee),
      next_day_fee: d.next_day_fee.trim() === "" ? null : Number(d.next_day_fee),
      delivery_fee: d.delivery_fee.trim() === "" ? null : Number(d.delivery_fee),
    };
    const { error } = await supabase.from("shipping_districts").update(payload).eq("id", id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "District updated" });
      qc.invalidateQueries({ queryKey: ["bouquet-shipping-districts"] });
      qc.invalidateQueries({ queryKey: ["shipping-districts-builder"] });
    }
  };

  const removeRow = async (id: string) => {
    await supabase.from("shipping_districts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["bouquet-shipping-districts"] });
    qc.invalidateQueries({ queryKey: ["shipping-districts-builder"] });
  };

  const addRow = async () => {
    const name = newRow.name.trim();
    if (!name) return;
    const payload: any = { name };
    if (newRow.same_day_fee.trim()) payload.same_day_fee = Number(newRow.same_day_fee);
    if (newRow.next_day_fee.trim()) payload.next_day_fee = Number(newRow.next_day_fee);
    if (newRow.delivery_fee.trim()) payload.delivery_fee = Number(newRow.delivery_fee);
    const { error } = await supabase.from("shipping_districts").insert(payload);
    if (error) toast({ title: "Add failed", description: error.message, variant: "destructive" });
    else {
      setNewRow({ name: "", same_day_fee: "", next_day_fee: "", delivery_fee: "" });
      qc.invalidateQueries({ queryKey: ["bouquet-shipping-districts"] });
      qc.invalidateQueries({ queryKey: ["shipping-districts-builder"] });
      toast({ title: "District added" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flower2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Custom Bouquet — District Delivery Speeds</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700">
            <Zap className="h-3 w-3" /> Same-Day fee set → shows Same-Day
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-700">
            <Clock className="h-3 w-3" /> Next-Day fee set → shows Next-Day
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
            Both empty → Standard only
          </span>
        </div>

        {/* Search */}
        <Input
          placeholder="Search district…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 max-w-xs"
          style={{ fontSize: 16 }}
        />

        {/* Rows */}
        <div className="space-y-2">
          {filtered.map((d: any) => {
            const row = drafts[d.id] || { same_day_fee: "", next_day_fee: "", delivery_fee: "" };
            const speed =
              row.same_day_fee.trim() !== ""
                ? "same_day"
                : row.next_day_fee.trim() !== ""
                ? "next_day"
                : "standard";
            return (
              <div
                key={d.id}
                className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto] gap-2 items-center bg-background rounded-md border p-2"
              >
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{d.name}</span>
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      speed === "same_day"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : speed === "next_day"
                        ? "bg-amber-500/15 text-amber-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {speed === "same_day" ? "Same-Day" : speed === "next_day" ? "Next-Day" : "Standard"}
                  </span>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Same-Day ৳"
                  value={row.same_day_fee}
                  onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...row, same_day_fee: e.target.value } }))}
                  className="h-9"
                  style={{ fontSize: 16 }}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Next-Day ৳"
                  value={row.next_day_fee}
                  onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...row, next_day_fee: e.target.value } }))}
                  className="h-9"
                  style={{ fontSize: 16 }}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Standard ৳"
                  value={row.delivery_fee}
                  onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...row, delivery_fee: e.target.value } }))}
                  className="h-9"
                  style={{ fontSize: 16 }}
                />
                <Button size="sm" variant="outline" onClick={() => saveRow(d.id)} className="h-9">
                  <Save className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRow(d.id)}
                  className="h-9 text-destructive hover:text-destructive"
                  aria-label={`Remove ${d.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No districts match — add one below.</p>
          )}
        </div>

        {/* Add new */}
        <div className="rounded-lg border-2 border-dashed p-3 bg-muted/20">
          <Label className="text-xs font-semibold">Add a missing district</Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2">
            <Input
              placeholder="District name (e.g. Rajshahi)"
              value={newRow.name}
              onChange={(e) => setNewRow((p) => ({ ...p, name: e.target.value }))}
              className="h-9 col-span-2 sm:col-span-1"
              style={{ fontSize: 16 }}
            />
            <Input
              type="number"
              placeholder="Same-Day ৳"
              value={newRow.same_day_fee}
              onChange={(e) => setNewRow((p) => ({ ...p, same_day_fee: e.target.value }))}
              className="h-9"
              style={{ fontSize: 16 }}
            />
            <Input
              type="number"
              placeholder="Next-Day ৳"
              value={newRow.next_day_fee}
              onChange={(e) => setNewRow((p) => ({ ...p, next_day_fee: e.target.value }))}
              className="h-9"
              style={{ fontSize: 16 }}
            />
            <Input
              type="number"
              placeholder="Standard ৳"
              value={newRow.delivery_fee}
              onChange={(e) => setNewRow((p) => ({ ...p, delivery_fee: e.target.value }))}
              className="h-9"
              style={{ fontSize: 16 }}
            />
            <Button size="sm" onClick={addRow} className="h-9 col-span-2 sm:col-span-1">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminShipping;
