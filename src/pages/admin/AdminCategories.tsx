import { useState, useEffect, lazy, Suspense } from "react";
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
import { Plus, Pencil, Trash2, GripVertical, PlusCircle, MinusCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import RichTextEditor from "@/components/admin/RichTextEditor";

type Category = Tables<"categories">;

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", short_description: "", long_description: "", faq: "[]", image_url: "", is_active: true, display_order: 0 });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("display_order");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", short_description: "", long_description: "", faq: "[]", image_url: "", is_active: true, display_order: 0 });
    setEditing(null);
    setImageFile(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      short_description: (cat as any).short_description || "",
      long_description: (cat as any).long_description || "",
      faq: JSON.stringify((cat as any).faq || []),
      image_url: cat.image_url || "",
      is_active: cat.is_active,
      display_order: cat.display_order,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}.${ext}`;
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
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const slug = form.slug || generateSlug(form.name);
    let parsedFaq: any[] = [];
    try { parsedFaq = JSON.parse(form.faq); } catch { parsedFaq = []; }
    const payload = { name: form.name.trim(), slug, description: form.description || null, short_description: form.short_description || null, long_description: form.long_description || null, faq: parsedFaq, image_url: imageUrl || null, is_active: form.is_active, display_order: form.display_order } as any;

    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Category updated" }); }
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Category created" }); }
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Category deleted" }); fetchCategories(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">Categories</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <div className="space-y-2">
                <Label>SEO Description (meta)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Meta description for SEO" />
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
                    <div key={idx} className="space-y-2 p-3 border rounded-lg bg-muted/30 relative">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => {
                        const updated = [...faqs];
                        updated.splice(idx, 1);
                        setForm({ ...form, faq: JSON.stringify(updated) });
                      }}>
                        <MinusCircle className="h-4 w-4 text-destructive" />
                      </Button>
                      <Input placeholder="Question" value={faq.question} onChange={(e) => {
                        const updated = [...faqs];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        setForm({ ...form, faq: JSON.stringify(updated) });
                      }} />
                      <Textarea placeholder="Answer" rows={2} value={faq.answer} onChange={(e) => {
                        const updated = [...faqs];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">No categories yet. Add your first category!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Short Desc</TableHead>
                  <TableHead>FAQ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell>
                      {cat.image_url ? <img src={cat.image_url} alt="" className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-muted rounded" />}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{(cat as any).short_description || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {(() => { try { const f = (cat as any).faq; return Array.isArray(f) ? `${f.length} items` : "—"; } catch { return "—"; } })()}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${cat.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default AdminCategories;
