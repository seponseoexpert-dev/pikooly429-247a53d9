import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

const AdminProducts = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const defaultForm = {
    name: "", slug: "", short_description: "", description: "", price: 0, original_price: 0,
    image_url: "", category_id: "", category_ids: [] as string[], subcategory_id: "", is_active: true, is_featured: false, stock: 0, tags: "",
    specifications: [] as Array<{ item: string; value: string }>,
    seo_title: "", seo_description: "",
  };
  const [form, setForm] = useState(defaultForm);

  const fetchData = async () => {
    const [prodRes, catRes, subRes, pcRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("subcategories").select("*").order("display_order"),
      supabase.from("product_categories").select("*"),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (subRes.data) setSubcategories(subRes.data as Subcategory[]);
    
    // Build product -> category_ids map
    if (pcRes.data) {
      const map: Record<string, string[]> = {};
      pcRes.data.forEach((pc: any) => {
        if (!map[pc.product_id]) map[pc.product_id] = [];
        map[pc.product_id].push(pc.category_id);
      });
      setProductCategoryMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => { setForm(defaultForm); setEditing(null); setImageFile(null); };

  const openEdit = (p: Product) => {
    setEditing(p);
    const specs = (p.specifications as Array<{ item: string; value: string }>) || [];
    const catIds = productCategoryMap[p.id] || (p.category_id ? [p.category_id] : []);
    setForm({
      name: p.name, slug: p.slug, short_description: (p as any).short_description || "", description: p.description || "",
      price: p.price, original_price: p.original_price || 0,
      image_url: p.image_url || "", category_id: p.category_id || "",
      category_ids: catIds,
      subcategory_id: (p as any).subcategory_id || "",
      is_active: p.is_active, is_featured: p.is_featured, stock: p.stock,
      tags: (p.tags || []).join(", "),
      specifications: specs,
      seo_title: (p as any).seo_title || "", seo_description: (p as any).seo_description || "",
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const filteredSubs = subcategories.filter(s => form.category_ids.includes(s.category_id));

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0) return;
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const slug = form.slug || generateSlug(form.name);
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const specs = form.specifications.filter(s => s.item.trim() || s.value.trim());
    
    // Use first selected category as primary category_id for backward compat
    const primaryCategoryId = form.category_ids.length > 0 ? form.category_ids[0] : null;
    
    const payload = {
      name: form.name.trim(), slug, short_description: form.short_description || null, description: form.description || null,
      price: form.price, original_price: form.original_price || null,
      image_url: imageUrl || null, category_id: primaryCategoryId,
      subcategory_id: form.subcategory_id || null,
      is_active: form.is_active, is_featured: form.is_featured, stock: form.stock, tags,
      specifications: specs.length > 0 ? specs : null,
      seo_title: form.seo_title.trim() || null, seo_description: form.seo_description.trim() || null,
    };

    let productId: string | null = null;

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      productId = editing.id;
      toast({ title: "Product updated" });
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      productId = data.id;
      toast({ title: "Product created" });
    }

    // Sync product_categories junction table
    if (productId) {
      await supabase.from("product_categories").delete().eq("product_id", productId);
      if (form.category_ids.length > 0) {
        const rows = form.category_ids.map(cid => ({ product_id: productId!, category_id: cid }));
        await supabase.from("product_categories").insert(rows);
      }
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Product deleted" }); fetchData(); }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || (productCategoryMap[p.id] || []).includes(filterCategory) || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const getCategoryNames = (productId: string, primaryCatId: string | null) => {
    const catIds = productCategoryMap[productId] || (primaryCatId ? [primaryCatId] : []);
    return catIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(", ") || "—";
  };

  const toggleCategory = (catId: string) => {
    setForm(prev => {
      const ids = prev.category_ids.includes(catId)
        ? prev.category_ids.filter(id => id !== catId)
        : [...prev.category_ids, catId];
      return { ...prev, category_ids: ids, category_id: ids[0] || "" };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-display font-bold">Products</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price (৳) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (৳)</Label>
                  <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Categories with Checkboxes */}
              <div className="space-y-3">
                <Label>Categories (select multiple)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                      <Checkbox
                        checked={form.category_ids.includes(c.id)}
                        onCheckedChange={() => toggleCategory(c.id)}
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
                {form.category_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.category_ids.map(id => {
                      const cat = categories.find(c => c.id === id);
                      return cat ? (
                        <span key={id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {cat.name} ✕
                          <button type="button" className="ml-1" onClick={() => toggleCategory(id)} />
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {filteredSubs.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategory (optional)</Label>
                  <Select value={form.subcategory_id} onValueChange={(v) => setForm({ ...form, subcategory_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {filteredSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Short Description</Label>
                <RichTextEditor value={form.short_description} onChange={(html) => setForm({ ...form, short_description: html })} />
              </div>
              <div className="space-y-2">
                <Label>Long Description</Label>
                <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 object-cover rounded" />}
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="flowers, birthday, gift" />
              </div>
              {/* Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Specifications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, specifications: [...form.specifications, { item: "", value: "" }] })}>
                    <Plus className="h-3 w-3 mr-1" />Add
                  </Button>
                </div>
                {form.specifications.map((spec, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Item name" value={spec.item} onChange={(e) => {
                      const specs = [...form.specifications];
                      specs[i] = { ...specs[i], item: e.target.value };
                      setForm({ ...form, specifications: specs });
                    }} className="flex-1" />
                    <Input placeholder="Value" value={spec.value} onChange={(e) => {
                      const specs = [...form.specifications];
                      specs[i] = { ...specs[i], value: e.target.value };
                      setForm({ ...form, specifications: specs });
                    }} className="flex-1" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                      setForm({ ...form, specifications: form.specifications.filter((_, idx) => idx !== i) });
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* SEO Section */}
              <div className="space-y-4 border-t pt-4 mt-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">🔍 SEO Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Google Search Preview</p>
                  <p className="text-[#1a0dab] text-lg leading-snug truncate font-medium">
                    {form.seo_title || form.name || "Product Title"}
                  </p>
                  <p className="text-[#006621] text-sm truncate">
                    yoursite.com/product/{form.slug || "product-slug"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {(() => { const raw = form.seo_description || form.description || "Product description will appear here..."; const tmp = document.createElement("div"); tmp.innerHTML = raw; return tmp.textContent || tmp.innerText || ""; })()}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>SEO Title</Label>
                    <span className={`text-xs ${(form.seo_title || form.name).length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                      {(form.seo_title || form.name).length}/60
                    </span>
                  </div>
                  <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder={form.name || "Custom SEO title..."} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permalink (Slug)</Label>
                    <span className={`text-xs ${form.slug.length > 75 ? "text-destructive" : "text-muted-foreground"}`}>
                      {form.slug.length}/75
                    </span>
                  </div>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Description</Label>
                    <span className={`text-xs ${(() => { const raw = form.seo_description || form.description; const tmp = document.createElement("div"); tmp.innerHTML = raw; return (tmp.textContent || "").length; })() > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                      {(() => { const raw = form.seo_description || form.description; const tmp = document.createElement("div"); tmp.innerHTML = raw; return (tmp.textContent || "").length; })()}/160
                    </span>
                  </div>
                  <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder={form.description || "Custom meta description..."} rows={2} />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} />
                  <Label>Featured</Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="h-12 w-12 bg-muted rounded-lg animate-pulse" /><div className="h-4 flex-1 bg-muted rounded animate-pulse" /><div className="h-4 w-16 bg-muted rounded animate-pulse" /><div className="h-5 w-14 bg-muted rounded-full animate-pulse" /><div className="h-8 w-8 bg-muted rounded animate-pulse" /></div>)}</div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-muted rounded" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.is_featured && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">Featured</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(p.price)}</span>
                        {p.original_price && <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(p.original_price)}</span>}
                      </TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{getCategoryNames(p.id, p.category_id)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
