import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Search } from "lucide-react";

const AdminCartAddons = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: addons = [] } = useQuery({
    queryKey: ["admin-cart-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_addons")
        .select("id, product_id, sort_order, is_active, products(id, name, image_url, price)")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["admin-addon-product-search", search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, price")
        .ilike("name", `%${search.trim()}%`)
        .eq("is_active", true)
        .limit(15);
      if (error) throw error;
      const existingIds = new Set(addons.map((a: any) => a.product_id));
      return (data as any[]).filter((p) => !existingIds.has(p.id));
    },
  });

  const addMut = useMutation({
    mutationFn: async (productId: string) => {
      const maxOrder = addons.reduce((m: number, a: any) => Math.max(m, a.sort_order || 0), 0);
      const { error } = await supabase.from("cart_addons").insert({
        product_id: productId,
        sort_order: maxOrder + 1,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cart-addons"] });
      qc.invalidateQueries({ queryKey: ["cart-addons"] });
      setSearch("");
      toast({ title: "Add-on added ✓" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("cart_addons").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cart-addons"] });
      qc.invalidateQueries({ queryKey: ["cart-addons"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cart-addons"] });
      qc.invalidateQueries({ queryKey: ["cart-addons"] });
      toast({ title: "Removed" });
    },
  });

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cart Add-ons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Products shown in the "Your last minute add-ons" section on the Cart page.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4 space-y-3">
          <label className="text-sm font-semibold">Add a product</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name (min 2 chars)..."
              className="pl-9 h-11 text-base"
            />
          </div>
          {search.trim().length >= 2 && (
            <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
              {searchProducts.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">No matching products</p>
              ) : (
                searchProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50">
                    <img src={p.image_url || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground">৳{p.price}</p>
                    </div>
                    <Button size="sm" onClick={() => addMut.mutate(p.id)} disabled={addMut.isPending}>
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Current Add-ons ({addons.length})</h2>
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No add-ons yet. Search and add products above.</p>
          ) : (
            <div className="divide-y">
              {addons.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5">
                  <img src={a.products?.image_url || "/placeholder.svg"} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{a.products?.name || "(deleted product)"}</p>
                    <p className="text-xs text-muted-foreground">৳{a.products?.price}</p>
                  </div>
                  <Input
                    type="number"
                    value={a.sort_order || 0}
                    onChange={(e) => updateMut.mutate({ id: a.id, patch: { sort_order: parseInt(e.target.value || "0") } })}
                    className="w-20 h-9 text-base"
                    title="Sort order"
                  />
                  <Switch
                    checked={a.is_active}
                    onCheckedChange={(c) => updateMut.mutate({ id: a.id, patch: { is_active: c } })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMut.mutate(a.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCartAddons;
