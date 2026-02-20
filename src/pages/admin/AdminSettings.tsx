import { useState, useEffect, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Building2, Globe, Mail, MapPin, Truck, KeyRound,
  Bell, BellRing, Share2, Cookie, BarChart3, Palette, Image,
  DollarSign, Users, Store, Gift, Ruler, Receipt, FileText,
  Shield, Languages, MessageSquare, CreditCard, Award, Settings,
  Upload, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingSections = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "site", label: "Site", icon: Globe },
  { key: "mail", label: "Mail", icon: Mail },
  { key: "location", label: "Location Setup", icon: MapPin },
  { key: "shipping", label: "Shipping Setup", icon: Truck },
  { key: "otp", label: "OTP", icon: KeyRound },
  { key: "notification", label: "Notification", icon: Bell },
  { key: "notification_alert", label: "Notification Alert", icon: BellRing },
  { key: "social_media", label: "Social Media", icon: Share2 },
  { key: "cookies", label: "Cookies", icon: Cookie },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "sliders", label: "Sliders", icon: Image },
  { key: "currencies", label: "Currencies", icon: DollarSign },
  { key: "suppliers", label: "Suppliers", icon: Users },
  { key: "outlets", label: "Outlets", icon: Store },
  { key: "benefits", label: "Benefits", icon: Gift },
  { key: "units", label: "Units", icon: Ruler },
  { key: "taxes", label: "Taxes", icon: Receipt },
  { key: "pages", label: "Pages", icon: FileText },
  { key: "role_permissions", label: "Role & Permissions", icon: Shield },
  { key: "languages", label: "Languages", icon: Languages },
  { key: "sms_gateway", label: "Sms Gateway", icon: MessageSquare },
  { key: "payment_gateway", label: "Payment Gateway", icon: CreditCard },
  { key: "license", label: "License", icon: Award },
];

// Define fields per section
const sectionFields: Record<string, { key: string; label: string; type?: string }[]> = {
  company: [
    { key: "store_name", label: "Company Name" },
    { key: "store_phone", label: "Phone" },
    { key: "store_email", label: "Email" },
    { key: "store_address", label: "Address" },
    { key: "company_website", label: "Website" },
    { key: "company_logo", label: "Logo", type: "image_upload" },
    { key: "company_favicon", label: "Favicon", type: "image_upload" },
  ],
  site: [
    { key: "site_title", label: "Site Title" },
    { key: "site_description", label: "Site Description", type: "textarea" },
    { key: "site_footer_text", label: "Footer Text" },
    { key: "site_copyright", label: "Copyright Text" },
    { key: "announcement_bar_text", label: "Announcement Bar Text" },
    { key: "announcement_bar_enabled", label: "Show Announcement Bar", type: "switch" },
    { key: "header_delivery_text", label: "Header Delivery Text (e.g. Where to deliver?)" },
    { key: "header_delivery_subtext", label: "Header Delivery Subtext (e.g. Location missing)" },
    { key: "maintenance_mode", label: "Maintenance Mode", type: "switch" },
  ],
  mail: [
    { key: "mail_host", label: "Mail Host" },
    { key: "mail_port", label: "Mail Port" },
    { key: "mail_username", label: "Mail Username" },
    { key: "mail_password", label: "Mail Password" },
    { key: "mail_from_address", label: "From Address" },
    { key: "mail_from_name", label: "From Name" },
    { key: "mail_encryption", label: "Encryption (TLS/SSL)" },
  ],
  location: [
    { key: "default_country", label: "Default Country" },
    { key: "default_city", label: "Default City" },
    { key: "default_state", label: "Default State" },
    { key: "default_timezone", label: "Timezone" },
    { key: "default_language", label: "Default Language" },
  ],
  shipping: [
    { key: "delivery_fee", label: "Delivery Fee (৳)" },
    { key: "free_delivery_min", label: "Free Delivery Minimum (৳)" },
    { key: "shipping_method", label: "Default Shipping Method" },
    { key: "estimated_delivery_days", label: "Estimated Delivery Days" },
    { key: "enable_free_shipping", label: "Enable Free Shipping", type: "switch" },
  ],
  otp: [
    { key: "otp_type", label: "OTP Type (SMS/Email)" },
    { key: "otp_digit_limit", label: "OTP Digit Limit" },
    { key: "otp_expire_time", label: "OTP Expire Time (min)" },
    { key: "otp_enabled", label: "Enable OTP", type: "switch" },
  ],
  notification: [
    { key: "push_notification_key", label: "Push Notification Key" },
    { key: "push_notification_enabled", label: "Enable Push Notification", type: "switch" },
    { key: "email_notification_enabled", label: "Enable Email Notification", type: "switch" },
  ],
  notification_alert: [
    { key: "order_alert", label: "Order Alert", type: "switch" },
    { key: "low_stock_alert", label: "Low Stock Alert", type: "switch" },
    { key: "new_user_alert", label: "New User Alert", type: "switch" },
    { key: "low_stock_threshold", label: "Low Stock Threshold" },
  ],
  social_media: [
    { key: "facebook_url", label: "Facebook URL" },
    { key: "instagram_url", label: "Instagram URL" },
    { key: "twitter_url", label: "Twitter / X URL" },
    { key: "youtube_url", label: "YouTube URL" },
    { key: "linkedin_url", label: "LinkedIn URL" },
    { key: "tiktok_url", label: "TikTok URL" },
    { key: "whatsapp_number", label: "WhatsApp Number" },
  ],
  cookies: [
    { key: "cookie_consent_enabled", label: "Enable Cookie Consent", type: "switch" },
    { key: "cookie_consent_text", label: "Consent Text", type: "textarea" },
  ],
  analytics: [
    { key: "google_analytics_id", label: "Google Analytics ID" },
    { key: "facebook_pixel_id", label: "Facebook Pixel ID" },
    { key: "google_tag_manager_id", label: "Google Tag Manager ID" },
  ],
  theme: [
    { key: "theme_primary_color", label: "Primary Color" },
    { key: "theme_secondary_color", label: "Secondary Color" },
    { key: "theme_font_family", label: "Font Family" },
    { key: "dark_mode_enabled", label: "Dark Mode", type: "switch" },
  ],
  sliders: [
    { key: "slider_1_image", label: "Slider 1 Image", type: "image_upload" },
    { key: "slider_1_title", label: "Slider 1 Title" },
    { key: "slider_1_link", label: "Slider 1 Link" },
    { key: "slider_2_image", label: "Slider 2 Image", type: "image_upload" },
    { key: "slider_2_title", label: "Slider 2 Title" },
    { key: "slider_2_link", label: "Slider 2 Link" },
    { key: "slider_3_image", label: "Slider 3 Image", type: "image_upload" },
    { key: "slider_3_title", label: "Slider 3 Title" },
    { key: "slider_3_link", label: "Slider 3 Link" },
  ],
  currencies: [
    { key: "default_currency", label: "Default Currency" },
    { key: "currency_symbol", label: "Currency Symbol" },
    { key: "currency_position", label: "Symbol Position (left/right)" },
    { key: "decimal_separator", label: "Decimal Separator" },
    { key: "thousand_separator", label: "Thousand Separator" },
  ],
  suppliers: [
    { key: "supplier_management_enabled", label: "Enable Supplier Management", type: "switch" },
    { key: "default_supplier_name", label: "Default Supplier Name" },
    { key: "default_supplier_contact", label: "Default Supplier Contact" },
  ],
  outlets: [
    { key: "multi_outlet_enabled", label: "Enable Multi Outlet", type: "switch" },
    { key: "default_outlet_name", label: "Default Outlet Name" },
    { key: "default_outlet_address", label: "Default Outlet Address" },
  ],
  benefits: [
    { key: "benefit_1_title", label: "Benefit 1 Title" },
    { key: "benefit_1_description", label: "Benefit 1 Description" },
    { key: "benefit_2_title", label: "Benefit 2 Title" },
    { key: "benefit_2_description", label: "Benefit 2 Description" },
    { key: "benefit_3_title", label: "Benefit 3 Title" },
    { key: "benefit_3_description", label: "Benefit 3 Description" },
  ],
  units: [
    { key: "default_weight_unit", label: "Weight Unit (kg/g/lb)" },
    { key: "default_length_unit", label: "Length Unit (cm/inch)" },
    { key: "default_quantity_unit", label: "Quantity Unit (pcs/box)" },
  ],
  taxes: [
    { key: "tax_enabled", label: "Enable Tax", type: "switch" },
    { key: "default_tax_rate", label: "Default Tax Rate (%)" },
    { key: "tax_included_in_price", label: "Tax Included in Price", type: "switch" },
    { key: "tax_label", label: "Tax Label (e.g. VAT)" },
  ],
  pages: [
    { key: "about_page_content", label: "About Page Content", type: "textarea" },
    { key: "terms_page_content", label: "Terms & Conditions", type: "textarea" },
    { key: "privacy_page_content", label: "Privacy Policy", type: "textarea" },
    { key: "refund_page_content", label: "Refund Policy", type: "textarea" },
  ],
  role_permissions: [
    { key: "admin_registration_enabled", label: "Admin Registration", type: "switch" },
    { key: "default_user_role", label: "Default User Role" },
  ],
  languages: [
    { key: "default_language_code", label: "Default Language Code" },
    { key: "multi_language_enabled", label: "Enable Multi Language", type: "switch" },
  ],
  sms_gateway: [
    { key: "sms_gateway_provider", label: "SMS Provider" },
    { key: "sms_api_key", label: "SMS API Key" },
    { key: "sms_sender_id", label: "SMS Sender ID" },
    { key: "sms_enabled", label: "Enable SMS", type: "switch" },
  ],
  payment_gateway: [
    { key: "cod_enabled", label: "Cash on Delivery", type: "switch" },
    { key: "bkash_enabled", label: "bKash Enabled", type: "switch" },
    { key: "bkash_app_key", label: "bKash App Key" },
    { key: "bkash_app_secret", label: "bKash App Secret" },
    { key: "nagad_enabled", label: "Nagad Enabled", type: "switch" },
    { key: "ssl_commerz_enabled", label: "SSLCommerz Enabled", type: "switch" },
    { key: "ssl_store_id", label: "SSLCommerz Store ID" },
    { key: "ssl_store_password", label: "SSLCommerz Store Password" },
  ],
  license: [
    { key: "license_key", label: "License Key" },
    { key: "license_type", label: "License Type" },
    { key: "license_expiry", label: "License Expiry Date" },
  ],
};

const ImageUploadField = ({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `settings/${fieldKey}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      toast({ title: "Image uploaded successfully ✓" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt={fieldKey}
            className="w-24 h-24 object-contain rounded-lg border bg-muted"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState("company");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const vals: Record<string, string> = {};
      settings.forEach((s: any) => { vals[s.key] = s.value || ""; });
      setFormValues(vals);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, string>) => {
      const fields = sectionFields[activeSection] || [];
      const keys = fields.map(f => f.key);

      const promises = keys.map(async (key) => {
        const value = vals[key] || "";
        const existing = settings.find((s: any) => s.key === key);
        if (existing) {
          return supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          return supabase.from("site_settings").insert({ key, value });
        }
      });

      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Settings saved successfully ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formValues);
  };

  const currentFields = sectionFields[activeSection] || [];
  const currentSection = settingSections.find(s => s.key === activeSection);
  const SectionIcon = currentSection?.icon || Settings;

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Settings</h2>
          <p className="text-muted-foreground text-sm">Manage store configuration</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings Menu
                </h3>
              </div>
              <nav className="p-1.5 max-h-[70vh] overflow-y-auto space-y-0.5">
                {settingSections.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors",
                      activeSection === key
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="bg-card border rounded-lg">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{currentSection?.label}</h3>
                    </div>
                    <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {saveMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <div className="p-4 space-y-4">
                    {currentFields.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center">
                        No settings available for this section yet.
                      </p>
                    ) : (
                      currentFields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-sm font-medium">{field.label}</label>
                          {field.type === "image_upload" ? (
                            <ImageUploadField
                              fieldKey={field.key}
                              value={formValues[field.key] || ""}
                              onChange={(url) =>
                                setFormValues({ ...formValues, [field.key]: url })
                              }
                            />
                          ) : field.type === "textarea" ? (
                            <Textarea
                              rows={4}
                              value={formValues[field.key] || ""}
                              onChange={(e) =>
                                setFormValues({ ...formValues, [field.key]: e.target.value })
                              }
                              placeholder={field.label}
                            />
                          ) : field.type === "switch" ? (
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={formValues[field.key] === "true"}
                                onCheckedChange={(checked) =>
                                  setFormValues({
                                    ...formValues,
                                    [field.key]: checked ? "true" : "false",
                                  })
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {formValues[field.key] === "true" ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          ) : (
                            <Input
                              value={formValues[field.key] || ""}
                              onChange={(e) =>
                                setFormValues({ ...formValues, [field.key]: e.target.value })
                              }
                              placeholder={field.label}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
