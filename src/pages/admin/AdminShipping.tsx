import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2, Truck } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface District {
  id: string;
  name: string;
  delivery_fee: number;
  delivery_label: string;
  is_active: boolean;
  display_order: number;
}

const AdminShipping = () => {
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", delivery_fee: "", delivery_label: "Standard Delivery" });

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

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        name: values.name.trim(),
        delivery_fee: parseFloat(values.delivery_fee) || 0,
        delivery_label: values.delivery_label.trim() || "Standard Delivery",
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
      setForm({ name: "", delivery_fee: "", delivery_label: "Standard Delivery" });
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

  const handleEdit = (d: District) => {
    setEditingId(d.id);
    setForm({ name: d.name, delivery_fee: String(d.delivery_fee), delivery_label: d.delivery_label });
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Shipping Districts</h2>
          <p className="text-muted-foreground text-sm">Manage delivery areas and fees</p>
        </div>
      </div>

      {/* Add/Edit form */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          {editingId ? "Edit District" : "Add New District"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="District Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Delivery Fee (৳)"
            type="number"
            value={form.delivery_fee}
            onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
          />
          <Input
            placeholder="Delivery Label"
            value={form.delivery_label}
            onChange={(e) => setForm({ ...form, delivery_label: e.target.value })}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", delivery_fee: "", delivery_label: "Standard Delivery" });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">District</th>
              <th className="text-left p-3 font-medium">Delivery Fee</th>
              <th className="text-left p-3 font-medium">Label</th>
              <th className="text-center p-3 font-medium">Active</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : districts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No districts added yet</td></tr>
            ) : (
              districts.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3">{formatCurrency(d.delivery_fee)}</td>
                  <td className="p-3 text-muted-foreground">{d.delivery_label}</td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={d.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, is_active: checked })}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(d)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminShipping;
