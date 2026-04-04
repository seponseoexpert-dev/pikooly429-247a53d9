import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Tag, CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/admin/RichTextEditor";

// ─── Event Categories Tab ───
const CategoriesTab = () => {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", short_description: "", long_description: "", image_url: "", icon: "", display_order: 0, is_active: true, seo_title: "", seo_description: "" });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-event-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editItem) {
        const { error } = await supabase.from("event_categories").update(values).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_categories").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-event-categories"] }); setShowForm(false); setEditItem(null); toast.success("সেভ হয়েছে"); },
    onError: () => toast.error("সমস্যা হয়েছে"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-event-categories"] }); toast.success("ডিলিট হয়েছে"); },
  });

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, slug: item.slug, description: item.description || "", short_description: item.short_description || "", long_description: item.long_description || "", image_url: item.image_url || "", icon: item.icon || "", display_order: item.display_order, is_active: item.is_active, seo_title: item.seo_title || "", seo_description: item.seo_description || "" });
    setShowForm(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ name: "", slug: "", description: "", short_description: "", long_description: "", image_url: "", icon: "", display_order: 0, is_active: true, seo_title: "", seo_description: "" });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">Event Categories</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add New</Button>
      </div>
      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {categories.map((cat: any) => (
            <div key={cat.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                {cat.image_url && <img src={cat.image_url} alt="" className="w-10 h-10 rounded object-cover" />}
                <div>
                  <p className="font-medium text-sm text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("ডিলিট করবেন?")) deleteMutation.mutate(cat.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-center text-muted-foreground py-6">কোনো ক্যাটাগরি নেই</p>}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "ক্যাটাগরি এডিট" : "নতুন ক্যাটাগরি"}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") }))} required />
            <Input placeholder="Slug" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Input placeholder="Short Description" value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} />
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Long Description (Rich Text)</label>
              <RichTextEditor value={form.long_description} onChange={v => setForm(p => ({ ...p, long_description: v }))} />
            </div>
            <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} />
            <Input placeholder="Icon (optional)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
            <Input placeholder="Display Order" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
            <Input placeholder="SEO Title (max 55 chars)" value={form.seo_title} onChange={e => setForm(p => ({ ...p, seo_title: e.target.value.slice(0, 55) }))} maxLength={55} />
            <div>
              <Textarea placeholder="SEO Description (max 160 chars)" value={form.seo_description} onChange={e => setForm(p => ({ ...p, seo_description: e.target.value.slice(0, 160) }))} maxLength={160} />
              <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <span className="text-sm">Active</span>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Event Packages Tab ───
const PackagesTab = () => {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: "", name: "", description: "", price: 0, original_price: "", features: "", image_url: "", is_featured: false, is_active: true, display_order: 0, seo_title: "", seo_description: "" });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-event-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("event_categories").select("id, name").order("display_order");
      return data || [];
    },
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-event-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_packages").select("*, event_categories(name)").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const featuresList = values.features ? values.features.split("\n").filter((f: string) => f.trim()).map((f: string) => f.trim()) : [];
      const payload = { ...values, features: featuresList, original_price: values.original_price ? parseFloat(values.original_price) : null };
      delete (payload as any).features_text;
      if (editItem) {
        const { error } = await supabase.from("event_packages").update(payload).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-event-packages"] }); setShowForm(false); setEditItem(null); toast.success("সেভ হয়েছে"); },
    onError: () => toast.error("সমস্যা হয়েছে"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-event-packages"] }); toast.success("ডিলিট হয়েছে"); },
  });

  const openEdit = (item: any) => {
    const featuresText = Array.isArray(item.features) ? item.features.join("\n") : "";
    setEditItem(item);
    setForm({ category_id: item.category_id, name: item.name, description: item.description || "", price: item.price, original_price: item.original_price?.toString() || "", features: featuresText, image_url: item.image_url || "", is_featured: item.is_featured, is_active: item.is_active, display_order: item.display_order, seo_title: item.seo_title || "", seo_description: item.seo_description || "" });
    setShowForm(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ category_id: categories[0]?.id || "", name: "", description: "", price: 0, original_price: "", features: "", image_url: "", is_featured: false, is_active: true, display_order: 0, seo_title: "", seo_description: "" });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">ইভেন্ট প্যাকেজ</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> নতুন প্যাকেজ</Button>
      </div>
      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {packages.map((pkg: any) => (
            <div key={pkg.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                {pkg.image_url && <img src={pkg.image_url} alt="" className="w-10 h-10 rounded object-cover" />}
                <div>
                  <p className="font-medium text-sm text-foreground">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">{(pkg as any).event_categories?.name} • ৳{pkg.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pkg.is_featured && <Badge>Featured</Badge>}
                <Badge variant={pkg.is_active ? "default" : "secondary"}>{pkg.is_active ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("ডিলিট করবেন?")) deleteMutation.mutate(pkg.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {packages.length === 0 && <p className="text-center text-muted-foreground py-6">কোনো প্যাকেজ নেই</p>}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "প্যাকেজ এডিট" : "নতুন প্যাকেজ"}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-3">
            <select className="w-full border border-border rounded-md p-2 bg-background text-foreground text-sm" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required>
              <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Package Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Price" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} required />
              <Input placeholder="Original Price (optional)" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Features (প্রতি লাইনে একটি)</label>
              <Textarea placeholder="Stage Decoration&#10;Flower Setup&#10;Lighting" value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} rows={4} />
            </div>
            <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} />
            <Input placeholder="Display Order" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
            <Input placeholder="SEO Title" value={form.seo_title} onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))} />
            <Textarea placeholder="SEO Description" value={form.seo_description} onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm(p => ({ ...p, is_featured: v }))} /><span className="text-sm">Featured</span></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><span className="text-sm">Active</span></div>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Event Bookings Tab ───
const BookingsTab = () => {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-event-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_bookings").select("*, event_packages(name), event_categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("event_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-event-bookings"] }); toast.success("আপডেট হয়েছে"); },
  });

  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">ইভেন্ট বুকিং সমূহ</h3>
      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">{b.booking_number}</p>
                  <p className="text-xs text-muted-foreground">{b.customer_name} • {b.customer_phone}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status] || "bg-muted text-foreground"}`}>{b.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <p>📅 {b.event_date}</p>
                <p>👥 {b.guest_count || "N/A"} guests</p>
                <p>📦 {(b as any).event_packages?.name || "N/A"}</p>
                <p>📁 {(b as any).event_categories?.name || "N/A"}</p>
                <p className="col-span-2">📍 {b.venue_address}</p>
              </div>
              <div className="flex gap-2">
                {["pending", "confirmed", "completed", "cancelled"].map(s => (
                  <Button key={s} variant={b.status === s ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => updateStatus.mutate({ id: b.id, status: s })}>{s}</Button>
                ))}
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-center text-muted-foreground py-6">কোনো বুকিং নেই</p>}
        </div>
      )}
    </div>
  );
};

// ─── Main Admin Events Page ───
const AdminEvents = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">ইভেন্ট ম্যানেজমেন্ট</h1>
        <Tabs defaultValue="categories">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="categories" className="gap-1"><Tag className="w-3.5 h-3.5" /> ক্যাটাগরি</TabsTrigger>
            <TabsTrigger value="packages" className="gap-1"><Package className="w-3.5 h-3.5" /> প্যাকেজ</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1"><CalendarCheck className="w-3.5 h-3.5" /> বুকিং</TabsTrigger>
          </TabsList>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="packages"><PackagesTab /></TabsContent>
          <TabsContent value="bookings"><BookingsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
