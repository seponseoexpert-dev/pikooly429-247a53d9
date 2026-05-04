import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Flower2, Package, Ruler, FileText, Palette } from "lucide-react";
import PageContentEditor from "@/components/admin/PageContentEditor";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { useState } from "react";
import { toast } from "sonner";

type ItemType = "flowers" | "materials" | "sizes" | "colors";

interface FormData {
  name: string;
  image_url: string;
  price: number;
  extra_price?: number;
  description?: string;
  hex_code?: string;
  is_active: boolean;
  display_order: number;
  available_districts?: string[];
  same_day_districts?: string[];
  next_day_districts?: string[];
}

const defaultForm: FormData = { name: "", image_url: "", price: 0, hex_code: "#ec4899", is_active: true, display_order: 0, available_districts: [], same_day_districts: [], next_day_districts: [] };

const AdminBouquet = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<ItemType>("flowers");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);

  const tableName = `bouquet_${tab}` as "bouquet_flowers" | "bouquet_materials" | "bouquet_sizes" | "bouquet_colors";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["bouquet", tab],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["shipping-districts-admin-bouquet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_districts")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        image_url: form.image_url || null,
        is_active: form.is_active,
        display_order: form.display_order,
      };
      if (tab === "sizes") {
        payload.extra_price = form.extra_price || 0;
        payload.description = form.description || null;
      } else if (tab === "colors") {
        payload.hex_code = form.hex_code || "#cccccc";
      } else {
        payload.price = form.price;
        if (tab === "flowers") {
          payload.available_districts = form.available_districts || [];
          payload.same_day_districts = form.same_day_districts || [];
          payload.next_day_districts = form.next_day_districts || [];
        }
      }

      if (editId) {
        const { error } = await supabase.from(tableName).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Updated!" : "Created!");
      qc.invalidateQueries({ queryKey: ["bouquet", tab] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted!");
      qc.invalidateQueries({ queryKey: ["bouquet", tab] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      image_url: item.image_url || "",
      price: item.price || 0,
      extra_price: item.extra_price || 0,
      description: item.description || "",
      hex_code: item.hex_code || "#ec4899",
      is_active: item.is_active,
      display_order: item.display_order,
      available_districts: item.available_districts || [],
    });
    setDialogOpen(true);
  };

  const toggleDistrict = (name: string) => {
    const current = form.available_districts || [];
    setForm({
      ...form,
      available_districts: current.includes(name)
        ? current.filter((d) => d !== name)
        : [...current, name],
    });
  };

  const tabLabels: Record<ItemType, string> = { flowers: "Flowers", materials: "Materials", sizes: "Sizes", colors: "Colors" };
  const tabIcons: Record<ItemType, any> = { flowers: Flower2, materials: Package, sizes: Ruler, colors: Palette };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Custom Bouquet Builder</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add {(tabLabels[tab] ?? "Item").slice(0, -1)}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit" : "Add"} {(tabLabels[tab] ?? "Item").slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Image</Label>
                  <CloudinaryUpload
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    folder={`bouquet-${tab}`}
                    label="Upload Image"
                  />
                </div>
                {tab === "sizes" ? (
                  <>
                    <div>
                      <Label>Extra Price (৳)</Label>
                      <Input type="number" value={form.extra_price || 0} onChange={(e) => setForm({ ...form, extra_price: +e.target.value })} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                  </>
                ) : tab === "colors" ? (
                  <div>
                    <Label>Color (Hex)</Label>
                    <div className="flex items-center gap-2 border border-border rounded-md h-10 px-2 bg-background">
                      <input
                        type="color"
                        value={form.hex_code || "#ec4899"}
                        onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                        className="h-7 w-9 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <Input
                        value={form.hex_code || ""}
                        onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                        className="border-0 px-1 text-sm h-8 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Price (৳)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                  </div>
                )}
                {tab === "flowers" && (
                  <div>
                    <Label>Available Districts</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select districts where this flower is available. Leave empty = available everywhere.
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto border border-border rounded-md p-2 bg-background">
                      {districts.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No districts found</span>
                      ) : (
                        districts.map((d: any) => {
                          const checked = (form.available_districts || []).includes(d.name);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleDistrict(d.name)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                checked
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {d.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                    {(form.available_districts || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, available_districts: [] })}
                        className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
                      >
                        Clear all (available everywhere)
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <div className="overflow-x-auto -mx-1 px-1 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsList className="inline-flex w-max">
              {(["flowers", "materials", "sizes", "colors"] as ItemType[]).map((t) => {
                const Icon = tabIcons[t];
                return (
                  <TabsTrigger key={t} value={t} className="gap-1.5 whitespace-nowrap">
                    <Icon className="h-4 w-4" />{tabLabels[t]}
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="seo" className="gap-1.5 whitespace-nowrap">
                <FileText className="h-4 w-4" />Page SEO
              </TabsTrigger>
            </TabsList>
          </div>

          {(["flowers", "materials", "sizes", "colors"] as ItemType[]).map((t) => (
            <TabsContent key={t} value={t}>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t === "colors" ? "Swatch" : "Image"}</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>{t === "sizes" ? "Extra Price" : t === "colors" ? "Hex" : "Price"}</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items yet</TableCell></TableRow>
                    ) : (
                      items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {t === "colors" ? (
                              <span
                                className="inline-block w-10 h-10 rounded-full border-2 border-border shadow-sm"
                                style={{ backgroundColor: item.hex_code || "#cccccc" }}
                              />
                            ) : item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            {t === "sizes" ? `৳${item.extra_price}` : t === "colors" ? <code className="text-xs">{item.hex_code}</code> : `৳${item.price}`}
                          </TableCell>
                          <TableCell>{item.display_order}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(item.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}

          <TabsContent value="seo">
            <PageContentEditor prefix="bouquet" title="Bouquet" />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default AdminBouquet;
