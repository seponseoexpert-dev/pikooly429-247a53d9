import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, PlusCircle, MinusCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import RichTextEditor from "@/components/admin/RichTextEditor";

type Category = Tables<"categories">;

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  seo_title: string | null;
  short_description: string | null;
  long_description: string | null;
  faq: any[] | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", short_description: "", long_description: "", faq: "[]", image_url: "", is_active: true, show_in_homepage: true, show_in_header: true, display_order: 0, seo_title: "", category_type: "category", allow_custom_image: false });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Subcategory state
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subForm, setSubForm] = useState({ name: "", slug: "", description: "", image_url: "", is_active: true, display_order: 0, category_id: "", seo_title: "", short_description: "", long_description: "", faq: "[]" });
  const [subImageFile, setSubImageFile] = useState<File | null>(null);
  const [savingSub, setSavingSub] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const fetchCategories = async () => {
    const [catRes, subRes] = await Promise.all([
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("subcategories").select("*").order("display_order"),
    ]);
    if (catRes.error) toast({ title: "Error", description: catRes.error.message, variant: "destructive" });
    else setCategories(catRes.data || []);
    if (!subRes.error) setSubcategories((subRes.data as Subcategory[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", short_description: "", long_description: "", faq: "[]", image_url: "", is_active: true, show_in_homepage: true, show_in_header: true, display_order: 0, seo_title: "", category_type: "category", allow_custom_image: false });
    setEditing(null);
    setImageFile(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || "",
      short_description: (cat as any).short_description || "",
      long_description: (cat as any).long_description || "",
      faq: JSON.stringify((cat as any).faq || []),
      image_url: cat.image_url || "", is_active: cat.is_active, show_in_homepage: (cat as any).show_in_homepage !== false, show_in_header: (cat as any).show_in_header !== false, display_order: cat.display_order,
      seo_title: (cat as any).seo_title || "",
      category_type: (cat as any).category_type || "category",
      allow_custom_image: (cat as any).allow_custom_image || false,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile, "categories");
      if (uploaded) imageUrl = uploaded;
    }

    const slug = form.slug || generateSlug(form.name);
    let parsedFaq: any[] = [];
    try { parsedFaq = JSON.parse(form.faq); } catch { parsedFaq = []; }
    const payload = { name: form.name.trim(), slug, description: form.description || null, short_description: form.short_description || null, long_description: form.long_description || null, faq: parsedFaq, image_url: imageUrl || null, is_active: form.is_active, show_in_homepage: form.show_in_homepage, show_in_header: form.show_in_header, display_order: form.display_order, seo_title: form.seo_title || null, category_type: form.category_type, allow_custom_image: form.allow_custom_image } as any;

    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Category updated" });
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Category created" });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Category deleted" }); fetchCategories(); }
  };

  // Subcategory handlers
  const resetSubForm = () => { setSubForm({ name: "", slug: "", description: "", image_url: "", is_active: true, display_order: 0, category_id: "", seo_title: "", short_description: "", long_description: "", faq: "[]" }); setEditingSub(null); setSubImageFile(null); };

  const openCreateSub = (categoryId: string) => {
    resetSubForm();
    setSubForm(prev => ({ ...prev, category_id: categoryId }));
    setSubDialogOpen(true);
  };

  const openEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubForm({ name: sub.name, slug: sub.slug, description: sub.description || "", image_url: sub.image_url || "", is_active: sub.is_active, display_order: sub.display_order, category_id: sub.category_id, seo_title: sub.seo_title || "", short_description: sub.short_description || "", long_description: sub.long_description || "", faq: JSON.stringify(sub.faq || []) });
    setSubImageFile(null);
    setSubDialogOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name.trim() || !subForm.category_id) return;
    setSavingSub(true);

    let imageUrl = subForm.image_url;
    if (subImageFile) {
      const uploaded = await uploadImage(subImageFile, "subcategories");
      if (uploaded) imageUrl = uploaded;
    }

    const slug = subForm.slug || generateSlug(subForm.name);
    let parsedSubFaq: any[] = [];
    try { parsedSubFaq = JSON.parse(subForm.faq); } catch { parsedSubFaq = []; }
    const payload = { name: subForm.name.trim(), slug, description: subForm.description || null, image_url: imageUrl || null, is_active: subForm.is_active, display_order: subForm.display_order, category_id: subForm.category_id, seo_title: subForm.seo_title || null, short_description: subForm.short_description || null, long_description: subForm.long_description || null, faq: parsedSubFaq } as any;

    if (editingSub) {
      const { error } = await supabase.from("subcategories").update(payload).eq("id", editingSub.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Subcategory updated" });
    } else {
      const { error } = await supabase.from("subcategories").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Subcategory created" });
    }

    setSavingSub(false);
    setSubDialogOpen(false);
    resetSubForm();
    fetchCategories();
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm("Delete this subcategory?")) return;
    const { error } = await supabase.from("subcategories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Subcategory deleted" }); fetchCategories(); }
  };

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const getSubsForCat = (catId: string) => subcategories.filter(s => s.category_id === catId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">Categories</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <RichTextEditor value={form.short_description} onChange={(html) => setForm({ ...form, short_description: html })} />
              </div>
              <div className="space-y-2">
                <Label>Long Description</Label>
                <RichTextEditor value={form.long_description} onChange={(html) => setForm({ ...form, long_description: html })} />
              </div>
              {/* SEO Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">SEO Preview</Label>
                <div className="p-4 border rounded-lg bg-background space-y-1">
                  <p className="text-xs text-muted-foreground mb-1">Preview</p>
                  <p className="text-sm text-muted-foreground truncate">https://pikooly.com.bd/product-category/{form.slug || "..."}/</p>
                  <p className="text-lg text-blue-700 font-medium leading-tight truncate">{form.seo_title || form.name || "Page Title"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{form.description || "Meta description will appear here..."}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>SEO Title</Label>
                    <span className={`text-xs ${(form.seo_title || "").length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{(form.seo_title || "").length} / 60</span>
                  </div>
                  <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="SEO title for search results" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permalink</Label>
                    <span className={`text-xs ${(form.slug || "").length > 75 ? "text-destructive" : "text-muted-foreground"}`}>{(form.slug || "").length} / 75</span>
                  </div>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Description</Label>
                    <span className={`text-xs ${(form.description || "").length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{(form.description || "").length} / 160</span>
                  </div>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Meta description for SEO" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 object-cover rounded" />}
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_homepage} onCheckedChange={(checked) => setForm({ ...form, show_in_homepage: checked })} />
                <Label>Show in Homepage (Shop by Category)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_header} onCheckedChange={(checked) => setForm({ ...form, show_in_header: checked })} />
                <Label>Show in Header (Category Navigation)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.allow_custom_image} onCheckedChange={(checked) => setForm({ ...form, allow_custom_image: checked })} />
                <Label>Allow Custom Image Upload (Mug, Photo Cake etc.)</Label>
              </div>
              <div className="space-y-2">
                <Label>Type (All Gifts Page)</Label>
                <select
                  value={form.category_type}
                  onChange={(e) => setForm({ ...form, category_type: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="category">Category</option>
                  <option value="occasion">Occasion</option>
                </select>
              </div>
              {/* FAQ Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">FAQ</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const faqs = JSON.parse(form.faq || "[]");
                    faqs.push({ question: "", answer: "" });
                    setForm({ ...form, faq: JSON.stringify(faqs) });
                  }}>
                    <PlusCircle className="h-4 w-4 mr-1" /> Add FAQ
                  </Button>
                </div>
                {(() => {
                  let faqs: { question: string; answer: string }[] = [];
                  try { faqs = JSON.parse(form.faq || "[]"); } catch { faqs = []; }
                  return faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-2 p-3 border rounded-lg bg-muted/30 relative pr-10">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => {
                        const updated = [...faqs]; updated.splice(idx, 1);
                        setForm({ ...form, faq: JSON.stringify(updated) });
                      }}>
                        <MinusCircle className="h-4 w-4 text-destructive" />
                      </Button>
                      <Input placeholder="Question" value={faq.question} onChange={(e) => {
                        const updated = [...faqs]; updated[idx] = { ...updated[idx], question: e.target.value };
                        setForm({ ...form, faq: JSON.stringify(updated) });
                      }} />
                      <Textarea placeholder="Answer" rows={2} value={faq.answer} onChange={(e) => {
                        const updated = [...faqs]; updated[idx] = { ...updated[idx], answer: e.target.value };
                        setForm({ ...form, faq: JSON.stringify(updated) });
                      }} />
                    </div>
                  ));
                })()}
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={(open) => { setSubDialogOpen(open); if (!open) resetSubForm(); }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingSub ? "Edit Subcategory" : "New Subcategory"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value, slug: generateSlug(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={subForm.slug} onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <RichTextEditor value={subForm.short_description} onChange={(html) => setSubForm({ ...subForm, short_description: html })} />
            </div>
            <div className="space-y-2">
              <Label>Long Description</Label>
              <RichTextEditor value={subForm.long_description} onChange={(html) => setSubForm({ ...subForm, long_description: html })} />
            </div>
            {/* SEO Section */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">SEO Preview</Label>
              <div className="p-4 border rounded-lg bg-background space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="text-sm text-muted-foreground truncate">https://pikooly.com.bd/product-category/.../{subForm.slug || "..."}/</p>
                <p className="text-lg text-blue-700 font-medium leading-tight truncate">{subForm.seo_title || subForm.name || "Page Title"}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{subForm.description || "Meta description will appear here..."}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>SEO Title</Label>
                  <span className={`text-xs ${(subForm.seo_title || "").length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{(subForm.seo_title || "").length} / 60</span>
                </div>
                <Input value={subForm.seo_title} onChange={(e) => setSubForm({ ...subForm, seo_title: e.target.value })} placeholder="SEO title for search results" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Permalink</Label>
                  <span className={`text-xs ${(subForm.slug || "").length > 75 ? "text-destructive" : "text-muted-foreground"}`}>{(subForm.slug || "").length} / 75</span>
                </div>
                <Input value={subForm.slug} onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Meta Description</Label>
                  <span className={`text-xs ${(subForm.description || "").length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{(subForm.description || "").length} / 160</span>
                </div>
                <Textarea value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} rows={3} placeholder="Meta description for SEO" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setSubImageFile(e.target.files?.[0] || null)} />
              {subForm.image_url && <img src={subForm.image_url} alt="" className="h-12 w-12 object-cover rounded" />}
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={subForm.display_order} onChange={(e) => setSubForm({ ...subForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={subForm.is_active} onCheckedChange={(c) => setSubForm({ ...subForm, is_active: c })} />
              <Label>Active</Label>
            </div>
            {/* FAQ Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">FAQ</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const faqs = JSON.parse(subForm.faq || "[]");
                  faqs.push({ question: "", answer: "" });
                  setSubForm({ ...subForm, faq: JSON.stringify(faqs) });
                }}>
                  <PlusCircle className="h-4 w-4 mr-1" /> Add FAQ
                </Button>
              </div>
              {(() => {
                let faqs: { question: string; answer: string }[] = [];
                try { faqs = JSON.parse(subForm.faq || "[]"); } catch { faqs = []; }
                return faqs.map((faq, idx) => (
                  <div key={idx} className="space-y-2 p-3 border rounded-lg bg-muted/30 relative pr-10">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => {
                      const updated = [...faqs]; updated.splice(idx, 1);
                      setSubForm({ ...subForm, faq: JSON.stringify(updated) });
                    }}>
                      <MinusCircle className="h-4 w-4 text-destructive" />
                    </Button>
                    <Input placeholder="Question" value={faq.question} onChange={(e) => {
                      const updated = [...faqs]; updated[idx] = { ...updated[idx], question: e.target.value };
                      setSubForm({ ...subForm, faq: JSON.stringify(updated) });
                    }} />
                    <Textarea placeholder="Answer" rows={2} value={faq.answer} onChange={(e) => {
                      const updated = [...faqs]; updated[idx] = { ...updated[idx], answer: e.target.value };
                      setSubForm({ ...subForm, faq: JSON.stringify(updated) });
                    }} />
                  </div>
                ));
              })()}
            </div>
            <Button type="submit" className="w-full" disabled={savingSub}>{savingSub ? "Saving..." : editingSub ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="h-10 w-10 bg-muted rounded-lg animate-pulse" /><div className="h-4 flex-1 bg-muted rounded animate-pulse" /><div className="h-5 w-16 bg-muted rounded-full animate-pulse" /><div className="h-8 w-8 bg-muted rounded animate-pulse" /></div>)}</div>
          ) : categories.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">No categories yet. Add your first category!</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 hidden sm:table-cell">#</TableHead>
                  <TableHead className="hidden sm:table-cell">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Slug</TableHead>
                  <TableHead className="hidden sm:table-cell">Subs</TableHead>
                  <TableHead className="hidden md:table-cell">Homepage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => {
                  const subs = getSubsForCat(cat.id);
                  const isExpanded = expandedCats.has(cat.id);
                  return (
                    <>
                      <TableRow key={cat.id}>
                        <TableCell className="hidden sm:table-cell"><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {cat.image_url ? <img src={cat.image_url} alt="" className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-muted rounded" />}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {subs.length > 0 && (
                              <button onClick={() => toggleExpand(cat.id)} className="p-0.5 hover:bg-muted rounded">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                            <div>
                              <span className="font-medium text-sm">{cat.name}</span>
                              <span className="block text-xs text-muted-foreground sm:hidden">{subs.length > 0 ? `${subs.length} subs` : ""}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm capitalize">{(cat as any).category_type || "category"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{cat.slug}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openCreateSub(cat.id)}>
                            <PlusCircle className="h-3 w-3 mr-1" />{subs.length > 0 ? `${subs.length} subs` : "Add sub"}
                          </Button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className={`text-xs px-2 py-1 rounded-full ${(cat as any).show_in_homepage !== false ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                            {(cat as any).show_in_homepage !== false ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${cat.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && subs.map((sub) => (
                        <TableRow key={sub.id} className="bg-muted/20">
                          <TableCell className="hidden sm:table-cell"></TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {sub.image_url ? <img src={sub.image_url} alt="" className="h-8 w-8 object-cover rounded" /> : <div className="h-8 w-8 bg-muted rounded" />}
                          </TableCell>
                          <TableCell className="text-sm"><span className="pl-2 sm:pl-8">↳ {sub.name}</span></TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{sub.slug}</TableCell>
                          <TableCell className="hidden lg:table-cell"></TableCell>
                          <TableCell className="hidden sm:table-cell"></TableCell>
                          <TableCell className="hidden md:table-cell"></TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${sub.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {sub.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSub(sub)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSub(sub.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategories;
