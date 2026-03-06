import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

// ─── Generic CRUD Section ───────────────────────────────────
interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "url" | "color" | "switch";
  placeholder?: string;
}

interface CrudSectionProps {
  table: string;
  queryKey: string;
  fields: Field[];
  defaultValues: Record<string, any>;
  title: string;
}

const CrudSection = ({ table, queryKey, fields, defaultValues, title }: CrudSectionProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>(defaultValues);

  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editing?.id) {
        const { error } = await supabase.from(table as any).update(values).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: "Saved!" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: "Deleted!" });
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ ...defaultValues });
  };

  const startEdit = (item: any) => {
    setEditing(item);
    const f: Record<string, any> = {};
    fields.forEach((fd) => {
      f[fd.key] = item[fd.key] ?? defaultValues[fd.key];
    });
    f.display_order = item.display_order ?? 0;
    f.is_active = item.is_active ?? true;
    setForm(f);
  };

  const handleSave = () => {
    const vals: Record<string, any> = {};
    fields.forEach((fd) => {
      vals[fd.key] = form[fd.key];
    });
    vals.display_order = Number(form.display_order) || 0;
    vals.is_active = form.is_active ?? true;
    saveMutation.mutate(vals);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!editing && (
          <Button size="sm" onClick={() => { setEditing({}); setForm({ ...defaultValues }); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((fd) => (
              <div key={fd.key}>
                <Label className="text-xs">{fd.label}</Label>
                {fd.type === "switch" ? (
                  <div className="mt-1">
                    <Switch checked={!!form[fd.key]} onCheckedChange={(v) => setForm({ ...form, [fd.key]: v })} />
                  </div>
                ) : fd.type === "color" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={form[fd.key] || "#f5f0d0"}
                      onChange={(e) => setForm({ ...form, [fd.key]: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={form[fd.key] || ""}
                      onChange={(e) => setForm({ ...form, [fd.key]: e.target.value })}
                      placeholder={fd.placeholder}
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <Input
                    type={fd.type}
                    value={form[fd.key] || ""}
                    onChange={(e) => setForm({ ...form, [fd.key]: fd.type === "number" ? Number(e.target.value) : e.target.value })}
                    placeholder={fd.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
            <div>
              <Label className="text-xs">Display Order</Label>
              <Input type="number" value={form.display_order || 0} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Active</Label>
              <div className="mt-1"><Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
              {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-10 h-14 rounded-lg object-cover" />}
              {item.logo_url && !item.image_url && !item.thumbnail_url && <img src={item.logo_url} alt="" className="h-6 object-contain" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name || item.title || item.label || "—"}</p>
                <p className="text-xs text-muted-foreground">Order: {item.display_order} • {item.is_active ? "Active" : "Inactive"}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {items.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No items yet. Click "Add" to create one.</p>}
        </div>
      )}
    </div>
  );
};

// ─── Admin Homepage Content Page ────────────────────────────
const AdminHomepageContent = () => {
  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-display font-bold mb-6">Homepage Content</h1>
        
        <Tabs defaultValue="offers" className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
            <TabsTrigger value="offers" className="text-xs sm:text-sm">Offers</TabsTrigger>
            <TabsTrigger value="relationships" className="text-xs sm:text-sm">Relationships</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs sm:text-sm">Stories</TabsTrigger>
            <TabsTrigger value="celebrations" className="text-xs sm:text-sm">Celebrations</TabsTrigger>
          </TabsList>

          <TabsContent value="offers">
            <CrudSection
              table="offer_banners"
              queryKey="admin-offer-banners"
              title="Exclusive Offers"
              defaultValues={{ title: "", subtitle: "", description: "", logo_url: "", link: "", bg_color: "#f5f0d0", display_order: 0, is_active: true }}
              fields={[
                { key: "title", label: "Title *", type: "text", placeholder: "₹200 Cashback" },
                { key: "subtitle", label: "Subtitle", type: "text", placeholder: "ENJOY UPTO" },
                { key: "description", label: "Description", type: "text", placeholder: "T&C Apply | Across 2 orders" },
                { key: "logo_url", label: "Logo URL", type: "url", placeholder: "https://..." },
                { key: "link", label: "Link", type: "url", placeholder: "/shop" },
                { key: "bg_color", label: "Background Color", type: "color", placeholder: "#f5f0d0" },
              ]}
            />
          </TabsContent>

          <TabsContent value="relationships">
            <CrudSection
              table="relationship_categories"
              queryKey="admin-relationship-categories"
              title="For Every Relationship"
              defaultValues={{ name: "", image_url: "", slug: "", link: "", display_order: 0, is_active: true }}
              fields={[
                { key: "name", label: "Name *", type: "text", placeholder: "Him" },
                { key: "slug", label: "Slug *", type: "text", placeholder: "him" },
                { key: "image_url", label: "Image URL", type: "url", placeholder: "https://..." },
                { key: "link", label: "Link", type: "url", placeholder: "/product-category/him" },
              ]}
            />
          </TabsContent>

          <TabsContent value="stories">
            <CrudSection
              table="gifting_stories"
              queryKey="admin-gifting-stories"
              title="Joyful Gifting Stories"
              defaultValues={{ title: "", label: "", thumbnail_url: "", video_url: "", views_count: 0, display_order: 0, is_active: true }}
              fields={[
                { key: "title", label: "Title", type: "text", placeholder: "Story title" },
                { key: "label", label: "Label/Tag", type: "text", placeholder: "BIRTHDAY GIFTS" },
                { key: "thumbnail_url", label: "Thumbnail URL", type: "url", placeholder: "https://..." },
                { key: "video_url", label: "Video URL", type: "url", placeholder: "https://youtube.com/..." },
                { key: "views_count", label: "Views Count", type: "number", placeholder: "1200" },
              ]}
            />
          </TabsContent>

          <TabsContent value="celebrations">
            <CrudSection
              table="celebrations"
              queryKey="admin-celebrations"
              title="Celebrations Calendar"
              defaultValues={{ name: "", date_label: "", image_url: "", link: "", display_order: 0, is_active: true }}
              fields={[
                { key: "name", label: "Name *", type: "text", placeholder: "Women's Day" },
                { key: "date_label", label: "Date Label *", type: "text", placeholder: "8TH MAR" },
                { key: "image_url", label: "Image URL", type: "url", placeholder: "https://..." },
                { key: "link", label: "Link", type: "url", placeholder: "/product-category/womens-day" },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageContent;
