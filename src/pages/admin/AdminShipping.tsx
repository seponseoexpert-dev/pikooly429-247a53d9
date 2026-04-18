import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2, Truck, ChevronDown, ChevronUp, Tag, Sun, Moon, Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface District {
  id: string;
  name: string;
  delivery_fee: number;
  delivery_label: string;
  same_day_fee: number;
  next_day_fee: number;
  same_day_label: string;
  next_day_label: string;
  morning_slot_fee: number;
  morning_slot_label: string;
  evening_slot_fee: number;
  evening_slot_label: string;
  is_active: boolean;
  display_order: number;
}

interface CategoryFee {
  id: string;
  district_id: string;
  category_id: string;
  delivery_fee: number;
  delivery_label: string;
  same_day_fee: number;
  next_day_fee: number;
  morning_slot_fee: number;
  evening_slot_fee: number;
}

const emptyForm = {
  name: "",
  morning_slot_fee: "",
  morning_slot_label: "Morning Slot (9 AM - 2 PM)",
  evening_slot_fee: "",
  evening_slot_label: "Evening Slot (4 PM - 10 PM)",
  next_day_fee: "",
  next_day_label: "Next Day Delivery",
};

const emptyCatForm = {
  category_id: "",
  morning_slot_fee: "",
  evening_slot_fee: "",
  next_day_fee: "",
};

const AdminShipping = () => {
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [catFeeForm, setCatFeeForm] = useState(emptyCatForm);

  const { data: districts = [], isLoading } = useQuery({
    queryKey: ["admin-shipping-districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_districts")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as District[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: categoryFees = [] } = useQuery({
    queryKey: ["admin-shipping-category-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_category_fees")
        .select("*");
      if (error) throw error;
      return data as CategoryFee[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const morning = parseFloat(values.morning_slot_fee) || 0;
      const evening = parseFloat(values.evening_slot_fee) || 0;
      const nextDay = parseFloat(values.next_day_fee) || 0;
      // Use morning fee as legacy same_day fallback
      const sameDayFallback = morning || evening;
      const payload = {
        name: values.name.trim(),
        delivery_fee: sameDayFallback,
        delivery_label: values.morning_slot_label.trim() || "Morning Slot",
        same_day_fee: sameDayFallback,
        same_day_label: "Same Day Delivery",
        morning_slot_fee: morning,
        morning_slot_label: values.morning_slot_label.trim() || "Morning Slot (9 AM - 2 PM)",
        evening_slot_fee: evening,
        evening_slot_label: values.evening_slot_label.trim() || "Evening Slot (4 PM - 10 PM)",
        next_day_fee: nextDay,
        next_day_label: values.next_day_label.trim() || "Next Day Delivery",
      };
      if (values.id) {
        const { error } = await supabase.from("shipping_districts").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_districts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-districts"] });
      toast({ title: "District saved ✓" });
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("shipping_districts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-districts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_districts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-districts"] });
      toast({ title: "District deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveCatFeeMutation = useMutation({
    mutationFn: async (values: { district_id: string; category_id: string; morning_slot_fee: string; evening_slot_fee: string; next_day_fee: string; id?: string }) => {
      const morning = parseFloat(values.morning_slot_fee) || 0;
      const evening = parseFloat(values.evening_slot_fee) || 0;
      const nextDay = parseFloat(values.next_day_fee) || 0;
      const sameDayFallback = morning || evening;
      const payload = {
        district_id: values.district_id,
        category_id: values.category_id,
        delivery_fee: sameDayFallback,
        delivery_label: "Same Day Delivery",
        same_day_fee: sameDayFallback,
        morning_slot_fee: morning,
        evening_slot_fee: evening,
        next_day_fee: nextDay,
      };
      if (values.id) {
        const { error } = await supabase.from("shipping_category_fees").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_category_fees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-category-fees"] });
      toast({ title: "Category fee saved ✓" });
      setCatFeeForm(emptyCatForm);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCatFeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_category_fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-category-fees"] });
      toast({ title: "Category fee deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleEdit = (d: District) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      morning_slot_fee: String(d.morning_slot_fee ?? d.same_day_fee ?? 0),
      morning_slot_label: d.morning_slot_label || "Morning Slot (9 AM - 2 PM)",
      evening_slot_fee: String(d.evening_slot_fee ?? d.same_day_fee ?? 0),
      evening_slot_label: d.evening_slot_label || "Evening Slot (4 PM - 10 PM)",
      next_day_fee: String(d.next_day_fee ?? 0),
      next_day_label: d.next_day_label || "Next Day Delivery",
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const handleSaveCatFee = (districtId: string) => {
    if (!catFeeForm.category_id) return toast({ title: "Select a category", variant: "destructive" });
    saveCatFeeMutation.mutate({ ...catFeeForm, district_id: districtId });
  };

  const getDistrictCategoryFees = (districtId: string) =>
    categoryFees.filter((cf) => cf.district_id === districtId);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name || "Unknown";

  const getAvailableCategories = (districtId: string) => {
    const usedCatIds = getDistrictCategoryFees(districtId).map((cf) => cf.category_id);
    return categories.filter((c) => !usedCatIds.includes(c.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">Shipping Districts</h2>
          <p className="text-muted-foreground text-sm">Morning Slot, Evening Slot & Next Day delivery fees per district</p>
        </div>
      </div>

      {/* Add/Edit form */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          {editingId ? "Edit District" : "Add New District"}
        </h3>
        <div className="space-y-3">
          <Input placeholder="District Name (e.g., Dhaka)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3 text-amber-500" /> Morning Slot Fee (৳)
              </label>
              <Input placeholder="e.g., 150" type="number" value={form.morning_slot_fee} onChange={(e) => setForm({ ...form, morning_slot_fee: e.target.value })} />
              <Input placeholder="Label" value={form.morning_slot_label} onChange={(e) => setForm({ ...form, morning_slot_label: e.target.value })} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Moon className="h-3 w-3 text-indigo-500" /> Evening Slot Fee (৳)
              </label>
              <Input placeholder="e.g., 180" type="number" value={form.evening_slot_fee} onChange={(e) => setForm({ ...form, evening_slot_fee: e.target.value })} />
              <Input placeholder="Label" value={form.evening_slot_label} onChange={(e) => setForm({ ...form, evening_slot_label: e.target.value })} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-blue-500" /> Next Day Fee (৳)
              </label>
              <Input placeholder="e.g., 80" type="number" value={form.next_day_fee} onChange={(e) => setForm({ ...form, next_day_fee: e.target.value })} />
              <Input placeholder="Label" value={form.next_day_label} onChange={(e) => setForm({ ...form, next_day_label: e.target.value })} className="text-xs" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="bg-card border rounded-lg p-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse mb-2" />)}
          </div>
        ) : districts.length === 0 ? (
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">No districts added yet</div>
        ) : (
          districts.map((d) => {
            const districtCatFees = getDistrictCategoryFees(d.id);
            const isExpanded = expandedDistrict === d.id;
            const availableCats = getAvailableCategories(d.id);

            return (
              <div key={d.id} className="bg-card border rounded-lg overflow-hidden">
                {/* District row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{d.name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Sun className="h-3 w-3 text-amber-500" />
                        Morning: {formatCurrency(d.morning_slot_fee ?? d.same_day_fee ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Moon className="h-3 w-3 text-indigo-500" />
                        Evening: {formatCurrency(d.evening_slot_fee ?? d.same_day_fee ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        Next Day: {formatCurrency(d.next_day_fee ?? 0)}
                      </span>
                      {districtCatFees.length > 0 && (
                        <span className="text-primary">({districtCatFees.length} category override{districtCatFees.length > 1 ? "s" : ""})</span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={d.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, is_active: checked })}
                  />
                  <Button size="sm" variant="outline" onClick={() => setExpandedDistrict(isExpanded ? null : d.id)}>
                    <Tag className="h-3.5 w-3.5 mr-1" />
                    Fees
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(d)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded: Category-specific fees */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 p-3 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category-Specific Delivery Fees</h4>
                    <p className="text-xs text-muted-foreground">
                      যদি কোনো ক্যাটেগরির জন্য আলাদা Morning / Evening / Next Day ফি সেট করেন, সেটা ডিফল্ট ফি এর বদলে ব্যবহার হবে।
                    </p>

                    {/* Existing category fees */}
                    {districtCatFees.length > 0 && (
                      <div className="space-y-1.5">
                        {districtCatFees.map((cf) => (
                          <div key={cf.id} className="flex flex-wrap items-center gap-2 bg-background rounded-md px-3 py-2 text-sm">
                            <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium flex-1 min-w-0 truncate">{getCategoryName(cf.category_id)}</span>
                            <span className="text-xs inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Sun className="h-3 w-3" /> {formatCurrency(cf.morning_slot_fee ?? cf.same_day_fee ?? 0)}
                            </span>
                            <span className="text-xs inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                              <Moon className="h-3 w-3" /> {formatCurrency(cf.evening_slot_fee ?? cf.same_day_fee ?? 0)}
                            </span>
                            <span className="text-xs inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Calendar className="h-3 w-3" /> {formatCurrency(cf.next_day_fee ?? 0)}
                            </span>
                            <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => deleteCatFeeMutation.mutate(cf.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new category fee */}
                    {availableCats.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={catFeeForm.category_id}
                          onChange={(e) => setCatFeeForm({ ...catFeeForm, category_id: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          {availableCats.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <Input
                          placeholder="Morning Fee"
                          type="number"
                          className="h-9"
                          value={catFeeForm.morning_slot_fee}
                          onChange={(e) => setCatFeeForm({ ...catFeeForm, morning_slot_fee: e.target.value })}
                        />
                        <Input
                          placeholder="Evening Fee"
                          type="number"
                          className="h-9"
                          value={catFeeForm.evening_slot_fee}
                          onChange={(e) => setCatFeeForm({ ...catFeeForm, evening_slot_fee: e.target.value })}
                        />
                        <Input
                          placeholder="Next Day Fee"
                          type="number"
                          className="h-9"
                          value={catFeeForm.next_day_fee}
                          onChange={(e) => setCatFeeForm({ ...catFeeForm, next_day_fee: e.target.value })}
                        />
                        <Button size="sm" className="h-9" onClick={() => handleSaveCatFee(d.id)} disabled={saveCatFeeMutation.isPending}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      </div>
                    )}

                    {availableCats.length === 0 && districtCatFees.length > 0 && (
                      <p className="text-xs text-muted-foreground">All categories have custom fees set.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminShipping;
