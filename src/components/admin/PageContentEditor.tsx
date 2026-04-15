import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import { FileText, Image, MessageSquare, Save } from "lucide-react";

interface PageContentEditorProps {
  prefix: string; // e.g. "events", "photography", "bouquet"
  title: string;
}

const PageContentEditor = ({ prefix, title }: PageContentEditorProps) => {
  const queryClient = useQueryClient();

  const allKeys = [
    `${prefix}_page_title`,
    `${prefix}_page_description`,
    `${prefix}_page_motto`,
    `${prefix}_page_image_1`,
    `${prefix}_page_image_2`,
    `${prefix}_page_image_3`,
    ...Array.from({ length: 10 }, (_, i) => [`${prefix}_page_faq_${i + 1}_question`, `${prefix}_page_faq_${i + 1}_answer`]).flat(),
  ];

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: [`${prefix}-page-content`],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", allKeys);
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !loaded) {
      const initial: Record<string, string> = {};
      allKeys.forEach(k => { initial[k] = settings[k] || ""; });
      setForm(initial);
      setLoaded(true);
    }
  }, [isLoading, loaded, settings]);

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of allKeys) {
        const value = form[key] || "";
        if (!value && !settings[key]) continue;
        const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("site_settings").insert({ key, value });
        }
      }
      queryClient.invalidateQueries({ queryKey: [`${prefix}-page-content`] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(`${title} content saved!`);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="p-4 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <FileText className="w-3 h-3" /> {title} — Page Content
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          This content appears at the bottom of the /{prefix}/ page above the footer for SEO purposes.
        </p>
      </div>

      {/* Section Title */}
      <div>
        <Label className="text-sm">Section Title</Label>
        <Input
          value={form[`${prefix}_page_title`] || ""}
          onChange={e => updateField(`${prefix}_page_title`, e.target.value)}
          placeholder={`${title} in Bangladesh`}
        />
      </div>

      {/* Long Description */}
      <div>
        <Label className="text-sm">Long Description (Rich Text)</Label>
        <RichTextEditor
          value={form[`${prefix}_page_description`] || ""}
          onChange={val => updateField(`${prefix}_page_description`, val)}
        />
      </div>

      {/* Motto */}
      <div>
        <Label className="text-sm">Motto / Tagline</Label>
        <Input
          value={form[`${prefix}_page_motto`] || ""}
          onChange={e => updateField(`${prefix}_page_motto`, e.target.value)}
          placeholder="Making every moment unforgettable"
        />
      </div>

      <Separator />

      {/* 3 Images */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Image className="w-3 h-3" /> Gallery Images (3 images grid)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Label className="text-xs text-muted-foreground">Image {i}</Label>
              <CloudinaryUpload
                value={form[`${prefix}_page_image_${i}`] || ""}
                onChange={url => updateField(`${prefix}_page_image_${i}`, url)}
                folder="page-content"
                label={`Upload Image ${i}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* FAQ Section */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> FAQ Section (up to 10)
        </Label>
        <div className="space-y-4 mt-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(i => {
            const qKey = `${prefix}_page_faq_${i}_question`;
            const aKey = `${prefix}_page_faq_${i}_answer`;
            const hasContent = form[qKey] || form[aKey];
            // Show first 3 always, rest only if they have content or previous one has content
            const prevQ = `${prefix}_page_faq_${i - 1}_question`;
            const showThis = i <= 3 || hasContent || (i > 1 && form[prevQ]);
            if (!showThis) return null;
            return (
              <div key={i} className="border border-border/50 rounded-lg p-3 bg-muted/20 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">FAQ {i}</Label>
                <Input
                  value={form[qKey] || ""}
                  onChange={e => updateField(qKey, e.target.value)}
                  placeholder={`Question ${i}`}
                />
                <Textarea
                  value={form[aKey] || ""}
                  onChange={e => updateField(aKey, e.target.value)}
                  placeholder={`Answer ${i}`}
                  rows={2}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : `Save ${title} Content`}
      </Button>
    </div>
  );
};

export default PageContentEditor;
