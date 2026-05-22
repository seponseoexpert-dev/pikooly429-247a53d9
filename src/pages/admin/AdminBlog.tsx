import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Sparkles, Loader2, Check } from "lucide-react";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Tables } from "@/integrations/supabase/types";

type Blog = Tables<"blogs">;

const AdminBlog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const defaultCategories = ["General", "Flowers", "Gifts", "Tips & Tricks", "Occasions", "Delivery", "News"];
  const [blogCategories, setBlogCategories] = useState<string[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");

  const defaultForm = { title: "", slug: "", content: "", excerpt: "", image_url: "", is_published: false, seo_title: "", seo_description: "", category: "General" };
  const [form, setForm] = useState(defaultForm);

  // AI Generator
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiTone, setAiTone] = useState("warm, locally-rooted Bangladeshi");
  const [aiWordCount, setAiWordCount] = useState<number>(1000);
  const [aiStep, setAiStep] = useState(0);

  const aiWorkflowSteps = [
    "Keyword Research",
    "Competitor Analysis",
    "Website Structure Planning",
    "Content Strategy",
    "Technical SEO Planning",
    "Final Keyword List",
    "On-Page SEO Setup",
    "Technical SEO Implementation",
    "Website Development",
    "Content Creation",
    "Analytics & Tracking Setup",
    "High-Quality Blog Post Writing",
  ];

  const runAiGenerate = async () => {
    if (!aiTopic.trim()) { toast({ title: "Topic required", variant: "destructive" }); return; }
    setAiLoading(true);
    setAiStep(0);
    const stepTimer = setInterval(() => {
      setAiStep((s) => (s < aiWorkflowSteps.length - 1 ? s + 1 : s));
    }, 1400);
    try {
      const { data, error } = await supabase.functions.invoke("ai-blog-generate", {
        body: { topic: aiTopic.trim(), keywords: aiKeywords.trim(), category: form.category, tone: aiTone.trim(), wordCount: aiWordCount },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = data as any;
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        slug: d.slug || f.slug,
        excerpt: d.excerpt || f.excerpt,
        content: d.content || f.content,
        seo_title: d.seo_title || f.seo_title,
        seo_description: d.seo_description || f.seo_description,
      }));
      setAiStep(aiWorkflowSteps.length); // mark all done
      toast({ title: "Content generated", description: "Review & edit before saving." });
      setTimeout(() => {
        setAiOpen(false);
        setAiTopic(""); setAiKeywords("");
      }, 600);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message || "AI error", variant: "destructive" });
    } finally {
      clearInterval(stepTimer);
      setAiLoading(false);
    }
  };

  // Load categories from DB
  const fetchCategories = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "blog_categories").single();
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) setBlogCategories(parsed);
      } catch {}
    }
  };

  // Save categories to DB
  const saveCategories = async (cats: string[]) => {
    setBlogCategories(cats);
    const value = JSON.stringify(cats);
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "blog_categories").single();
    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", "blog_categories");
    } else {
      await supabase.from("site_settings").insert({ key: "blog_categories", value });
    }
  };

  const fetchBlogs = async () => {
    const { data, error } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setBlogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBlogs(); fetchCategories(); }, []);

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => { setForm(defaultForm); setEditing(null); setImageFile(null); };

  const openEdit = (blog: Blog) => {
    setEditing(blog);
    setForm({
      title: blog.title, slug: blog.slug, content: blog.content || "",
      excerpt: blog.excerpt || "", image_url: blog.image_url || "", is_published: blog.is_published,
      seo_title: (blog as any).seo_title || "", seo_description: (blog as any).seo_description || "",
      category: (blog as any).category || "General",
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const { convertToWebP } = await import("@/lib/imageUtils");
    const webpFile = await convertToWebP(file);
    const path = `blogs/${Date.now()}.webp`;
    const { error } = await supabase.storage.from("images").upload(path, webpFile, { contentType: "image/webp" });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const slug = form.slug || generateSlug(form.title);
    const payload = {
      title: form.title.trim(), slug, content: form.content || null,
      excerpt: form.excerpt || null, image_url: imageUrl || null,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      author_id: user?.id || null,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      category: form.category || "General",
    };

    if (editing) {
      const { error } = await supabase.from("blogs").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Blog post updated" });
    } else {
      const { error } = await supabase.from("blogs").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Blog post created" });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchBlogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Blog post deleted" }); fetchBlogs(); }
  };

  const togglePublish = async (blog: Blog) => {
    const is_published = !blog.is_published;
    const { error } = await supabase.from("blogs").update({
      is_published,
      published_at: is_published ? new Date().toISOString() : null,
    }).eq("id", blog.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: is_published ? "Published" : "Unpublished" }); fetchBlogs(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold">Blog Posts</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Post</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="w-full group relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background px-4 py-3 text-left transition-all hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">AI Content Generator</div>
                    <div className="text-[11px] text-muted-foreground">SEO-friendly · Bangladesh-targeted · Semantic + safe internal links · 100% human-style</div>
                  </div>
                </div>
              </button>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {blogCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <span className="flex items-center justify-between w-full gap-2">
                            {cat}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Category management */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {blogCategories.map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                        {cat}
                        {cat !== "General" && (
                          <button type="button" onClick={() => saveCategories(blogCategories.filter(c => c !== cat))} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category..."
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const trimmed = newCategory.trim();
                          if (trimmed && !blogCategories.includes(trimmed)) {
                            saveCategories([...blogCategories, trimmed]);
                            setNewCategory("");
                          }
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                      const trimmed = newCategory.trim();
                      if (trimmed && !blogCategories.includes(trimmed)) {
                        saveCategories([...blogCategories, trimmed]);
                        setNewCategory("");
                      }
                    }}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary..." />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <CloudinaryUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="blogs"
                  label="Upload Cover Image"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(c) => setForm({ ...form, is_published: c })} />
                <Label>Publish immediately</Label>
              </div>

              {/* Yoast-style SEO Section */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">🔍 SEO Preview</h3>
                {/* Google Preview */}
                <div className="bg-background rounded-lg p-4 border border-border space-y-1">
                  <p className="text-[#1a0dab] text-lg leading-snug truncate">
                    {form.seo_title || form.title || "Blog Post Title"}
                  </p>
                  <p className="text-[#006621] text-sm truncate">
                    yoursite.com/blog/{form.slug || "post-slug"}
                  </p>
                  <p className="text-sm text-[#545454] line-clamp-2">
                    {form.seo_description || form.excerpt || "Add a meta description for search engines..."}
                  </p>
                </div>
                {/* SEO Fields */}
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input
                    value={form.seo_title}
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                    placeholder={form.title || "SEO title..."}
                    maxLength={60}
                  />
                  <p className={`text-xs ${form.seo_title.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.seo_title.length}/60 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={form.seo_description}
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                    placeholder={form.excerpt || "Meta description..."}
                    rows={3}
                    maxLength={160}
                  />
                  <p className={`text-xs ${form.seo_description.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.seo_description.length}/160 characters
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="h-12 w-16 bg-muted rounded-lg animate-pulse" /><div className="h-4 flex-1 bg-muted rounded animate-pulse" /><div className="h-5 w-20 bg-muted rounded-full animate-pulse" /><div className="h-4 w-24 bg-muted rounded animate-pulse" /></div>)}</div>
          ) : blogs.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">No blog posts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="hidden sm:table-cell">
                        {blog.image_url ? <img src={blog.image_url} alt="" className="h-10 w-16 object-cover rounded" /> : <div className="h-10 w-16 bg-muted rounded" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{blog.title}</div>
                        {blog.excerpt && <div className="text-xs text-muted-foreground line-clamp-1">{blog.excerpt}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${blog.is_published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                          {blog.is_published ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">{(blog as any).category || "General"}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(blog.created_at).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(blog)} title={blog.is_published ? "Unpublish" : "Publish"}>
                          {blog.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(blog)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(blog.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generator Dialog */}
      <Dialog open={aiOpen} onOpenChange={(o) => { if (!aiLoading) setAiOpen(o); }}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 px-5 py-4 border-b">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles size={15} className="text-primary" />
                </span>
                AI Blog Content Generator
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Generates Title, Slug, Excerpt, Content, SEO Title & Meta — Bangladesh-targeted, semantic SEO, safe internal links, 0% AI-feel.
              </p>
            </DialogHeader>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Topic / blog idea *</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Best birthday flower bouquets in Dhaka"
                className="text-[16px]"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Focus keywords (comma-separated)</Label>
              <Input
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="birthday flowers, dhaka delivery, rose bouquet"
                className="text-[16px]"
              />
              {aiKeywords.trim() && (
                <p className="text-[10px] text-muted-foreground">
                  {aiKeywords.split(",").map(k => k.trim()).filter(Boolean).length} keyword(s) will be woven into the post
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Word count: <span className="text-primary font-semibold">{aiWordCount}</span> words
              </Label>
              <Input
                type="number"
                min={300}
                max={4000}
                step={50}
                value={aiWordCount}
                onChange={(e) => setAiWordCount(Math.max(300, Math.min(4000, Number(e.target.value) || 1000)))}
                className="text-[16px]"
              />
              <p className="text-[10px] text-muted-foreground">Min 300 · Max 4000 · Recommended 800–1500</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tone</Label>
              <Input
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                placeholder="warm, locally-rooted Bangladeshi"
                className="text-[16px]"
              />
            </div>
            {aiLoading ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5 max-h-72 overflow-y-auto">
                <div className="text-[11px] font-semibold text-primary mb-1.5 uppercase tracking-wide">SEO Workflow in progress</div>
                {aiWorkflowSteps.map((step, i) => {
                  const done = i < aiStep;
                  const active = i === aiStep;
                  return (
                    <div key={step} className={`flex items-center gap-2 text-xs transition-all ${done ? "text-foreground" : active ? "text-primary font-medium" : "text-muted-foreground/60"}`}>
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 border border-primary" : "bg-muted border border-border"}`}>
                        {done ? <Check size={10} strokeWidth={3} /> : active ? <Loader2 size={10} className="animate-spin" /> : <span className="text-[9px]">{i + 1}</span>}
                      </span>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                ✓ Semantic SEO (LSI keywords woven naturally)<br />
                ✓ 2–4 safe internal links from whitelist only<br />
                ✓ Question-style H2s + FAQ for AI Overviews<br />
                ✓ Bangladesh context (cities, occasions) · No banned AI phrases
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t bg-muted/30 flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" disabled={aiLoading} onClick={() => setAiOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={runAiGenerate} disabled={aiLoading || !aiTopic.trim()}>
              {aiLoading ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Generating...</> : <><Sparkles size={14} className="mr-1.5" /> Generate</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default AdminBlog;
