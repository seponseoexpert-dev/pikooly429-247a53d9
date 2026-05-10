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
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { ensureAdminSession } from "@/lib/ensureAdmin";
import ProductVariantsManager, { saveProductVariants } from "@/components/admin/ProductVariantsManager";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const defaultForm = {
    name: "", slug: "", short_description: "", description: "", price: 0, original_price: 0,
    image_url: "", category_id: "", category_ids: [] as string[], subcategory_ids: [] as string[], is_active: true, is_featured: false, stock: 0, tags: "",
    allow_custom_image: false, allow_custom_text: false,
    specifications: [] as Array<{ item: string; value: string }>,
    seo_title: "", seo_description: "", delivery_time: "",
    instructions: "", delivery_info: "",
    is_preorder: false, preorder_note: "", preorder_advance_percent: 50,
  };
  const [form, setForm] = useState(defaultForm);

  const [productSubcategoryMap, setProductSubcategoryMap] = useState<Record<string, string[]>>({});

  const fetchData = async () => {
    const [prodRes, catRes, subRes, pcRes, pscRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("subcategories").select("*").order("display_order"),
      supabase.from("product_categories").select("*"),
      supabase.from("product_subcategories").select("*"),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (subRes.data) setSubcategories(subRes.data as Subcategory[]);
    
    if (pcRes.data) {
      const map: Record<string, string[]> = {};
      pcRes.data.forEach((pc: any) => {
        if (!map[pc.product_id]) map[pc.product_id] = [];
        map[pc.product_id].push(pc.category_id);
      });
      setProductCategoryMap(map);
    }
    if (pscRes.data) {
      const map: Record<string, string[]> = {};
      pscRes.data.forEach((psc: any) => {
        if (!map[psc.product_id]) map[psc.product_id] = [];
        map[psc.product_id].push(psc.subcategory_id);
      });
      setProductSubcategoryMap(map);
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
    const subIds = productSubcategoryMap[p.id] || ((p as any).subcategory_id ? [(p as any).subcategory_id] : []);
    setForm({
      name: p.name, slug: p.slug, short_description: (p as any).short_description || "", description: p.description || "",
      price: p.price, original_price: p.original_price || 0,
      image_url: p.image_url || "", category_id: p.category_id || "",
      category_ids: catIds,
      subcategory_ids: subIds,
      is_active: p.is_active, is_featured: p.is_featured, stock: p.stock,
      allow_custom_image: (p as any).allow_custom_image || false, allow_custom_text: (p as any).allow_custom_text || false,
      tags: (p.tags || []).join(", "),
      specifications: specs,
      seo_title: (p as any).seo_title || "", seo_description: (p as any).seo_description || "",
      delivery_time: (p as any).delivery_time || "",
      instructions: (p as any).instructions || "", delivery_info: (p as any).delivery_info || "",
      is_preorder: (p as any).is_preorder || false,
      preorder_note: (p as any).preorder_note || "",
      preorder_advance_percent: (p as any).preorder_advance_percent ?? 50,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const filteredSubs = subcategories.filter(s => form.category_ids.includes(s.category_id));

  const uploadImage = async (file: File): Promise<string | null> => {
    const { convertToWebP } = await import("@/lib/imageUtils");
    const webpFile = await convertToWebP(file);
    const path = `products/${Date.now()}.webp`;
    const { error } = await supabase.storage.from("images").upload(path, webpFile, { contentType: "image/webp" });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    let imageUrl = form.image_url;
    const slug = form.slug || generateSlug(form.name);
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const specs = form.specifications.filter(s => s.item.trim() || s.value.trim());
    
    // Use first selected category as primary category_id for backward compat
    const primaryCategoryId = form.category_ids.length > 0 ? form.category_ids[0] : null;
    
    const payload = {
      name: form.name.trim(), slug, short_description: form.short_description || null, description: form.description || null,
      price: form.price, original_price: form.original_price || null,
      image_url: imageUrl || null, category_id: primaryCategoryId,
      subcategory_id: form.subcategory_ids.length > 0 ? form.subcategory_ids[0] : null,
      is_active: form.is_active, is_featured: form.is_featured, stock: form.stock, tags,
      allow_custom_image: form.allow_custom_image, allow_custom_text: form.allow_custom_text,
      specifications: specs.length > 0 ? specs : null,
      seo_title: form.seo_title.trim() || null, seo_description: form.seo_description.trim() || null,
      delivery_time: form.delivery_time.trim() || null,
      instructions: form.instructions || null, delivery_info: form.delivery_info || null,
      is_preorder: form.is_preorder,
      preorder_note: form.preorder_note.trim() || null,
      preorder_advance_percent: form.preorder_advance_percent || 50,
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

    // Sync variants (sizes + colors)
    if (productId) {
      await saveProductVariants(productId);
    }

    // Sync junction tables
    if (productId) {
      await supabase.from("product_categories").delete().eq("product_id", productId);
      if (form.category_ids.length > 0) {
        const rows = form.category_ids.map(cid => ({ product_id: productId!, category_id: cid }));
        await supabase.from("product_categories").insert(rows);
      }
      await supabase.from("product_subcategories").delete().eq("product_id", productId);
      if (form.subcategory_ids.length > 0) {
        const subRows = form.subcategory_ids.map(sid => ({ product_id: productId!, subcategory_id: sid }));
        await supabase.from("product_subcategories").insert(subRows);
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
        <h2 className="text-xl sm:text-2xl font-display font-bold">Products</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sale Price (৳)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                  <p className="text-[11px] text-muted-foreground leading-tight">Customer pays this</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Regular Price (৳)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0 = no discount"
                  />
                  {form.original_price > 0 && form.original_price <= form.price ? (
                    <p className="text-[11px] text-destructive leading-tight">⚠ Must be higher than Sale Price</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground leading-tight">Higher than Sale Price for discount</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Delivery Time (Display Badge)</Label>
                  <Input value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} placeholder="e.g. 2 Hours" />
                </div>
              </div>

              {/* Delivery is now controlled globally in Settings → Delivery Presets. */}
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
                  <Label>Subcategory (select multiple)</Label>
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-1">
                    {filteredSubs.map((s) => (
                      <label key={s.id} className="flex items-center justify-between cursor-pointer p-2.5 rounded hover:bg-muted transition-colors border-b border-border/40 last:border-0">
                        <span className="text-sm">{s.name}</span>
                        <Checkbox
                          checked={form.subcategory_ids.includes(s.id)}
                          onCheckedChange={(checked) => {
                            const ids = checked
                              ? [...form.subcategory_ids, s.id]
                              : form.subcategory_ids.filter(id => id !== s.id);
                            setForm({ ...form, subcategory_ids: ids });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  {form.subcategory_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.subcategory_ids.map(sid => {
                        const sub = subcategories.find(s => s.id === sid);
                        return sub ? (
                          <span key={sid} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                            {sub.name}
                            <button type="button" onClick={() => setForm({ ...form, subcategory_ids: form.subcategory_ids.filter(id => id !== sid) })} className="hover:text-destructive">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
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
                <Label>Instructions <span className="text-xs text-muted-foreground font-normal">(Care/usage instructions — leave empty for default)</span></Label>
                <RichTextEditor value={form.instructions} onChange={(html) => setForm({ ...form, instructions: html })} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Info <span className="text-xs text-muted-foreground font-normal">(Custom delivery details — leave empty for default)</span></Label>
                <RichTextEditor value={form.delivery_info} onChange={(html) => setForm({ ...form, delivery_info: html })} />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <CloudinaryUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="products"
                  label="Upload Product Image"
                />
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
              {/* Variants */}
              <ProductVariantsManager productId={editing?.id || null} />

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

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.allow_custom_image} onCheckedChange={(c) => setForm({ ...form, allow_custom_image: c })} />
                  <Label>📷 Custom Photo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.allow_custom_text} onCheckedChange={(c) => setForm({ ...form, allow_custom_text: c })} />
                  <Label>✏️ Custom Text</Label>
                </div>
              </div>

              {/* Pre-order Section */}
              <div className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_preorder} onCheckedChange={(c) => setForm({ ...form, is_preorder: c })} />
                  <Label className="font-semibold">📦 Pre-order Mode</Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Auto-enabled when stock = 0. Manual toggle works even with stock available.
                </p>
                {(form.is_preorder || form.stock <= 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Pre-order Note</Label>
                      <Input
                        value={form.preorder_note}
                        onChange={(e) => setForm({ ...form, preorder_note: e.target.value })}
                        placeholder="e.g. Ships in 7-10 days"
                        style={{ fontSize: 16 }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Advance Payment %</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={form.preorder_advance_percent}
                        onChange={(e) => setForm({ ...form, preorder_advance_percent: parseInt(e.target.value) || 50 })}
                        style={{ fontSize: 16 }}
                      />
                    </div>
                  </div>
                )}
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

      {/* Bulk Apply Delivery Type */}
      <div className="mb-4 border border-border rounded-lg bg-muted/20 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
            onCheckedChange={(c) => setSelectedIds(c ? filtered.map((p) => p.id) : [])}
          />
          <span className="text-sm font-medium">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
          </span>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-14 w-14 bg-muted rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No products found.</CardContent></Card>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-3 p-3">
                  <Checkbox
                    className="mt-1"
                    checked={selectedIds.includes(p.id)}
                    onCheckedChange={(c) =>
                      setSelectedIds(c ? [...selectedIds, p.id] : selectedIds.filter((id) => id !== p.id))
                    }
                  />
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-16 w-16 object-cover rounded-xl shrink-0 border border-border" />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-xl shrink-0 flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-primary">{formatCurrency(p.price)}</span>
                          {p.original_price && p.original_price > p.price && (
                            <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.original_price)}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Stock: {p.stock}</span>
                        {p.is_featured && <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px]">Featured</span>}
                      </div>
                      <div className="flex items-center gap-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="h-12 w-12 bg-muted rounded-lg animate-pulse" /><div className="h-4 flex-1 bg-muted rounded animate-pulse" /><div className="h-4 w-16 bg-muted rounded animate-pulse" /><div className="h-5 w-14 bg-muted rounded-full animate-pulse" /><div className="h-8 w-8 bg-muted rounded animate-pulse" /></div>)}</div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">No products found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                      onCheckedChange={(c) => setSelectedIds(c ? filtered.map((p) => p.id) : [])}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} data-state={selectedIds.includes(p.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(p.id)}
                        onCheckedChange={(c) =>
                          setSelectedIds(c ? [...selectedIds, p.id] : selectedIds.filter((id) => id !== p.id))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-muted rounded" />}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{p.name}</div>
                      {p.is_featured && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">Featured</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{formatCurrency(p.price)}</span>
                      {p.original_price && <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(p.original_price)}</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.stock}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm max-w-[150px] truncate">{getCategoryNames(p.id, p.category_id)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
