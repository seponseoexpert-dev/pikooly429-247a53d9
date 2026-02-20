import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Building2, Globe, Mail, MapPin, KeyRound,
  Bell, BellRing, Share2, Cookie, BarChart3, Palette, Image,
  Settings, Upload, X,
  Store, Gift, Ruler, Receipt, FileText, Shield, Languages,
  MessageSquare, CreditCard, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingSections = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "site", label: "Site", icon: Globe },
  { key: "mail", label: "Mail", icon: Mail },
  { key: "otp", label: "OTP", icon: KeyRound },
  { key: "notification_alert", label: "Notification Alert", icon: BellRing },
  { key: "social_media", label: "Social Media", icon: Share2 },
  { key: "cookies", label: "Cookies", icon: Cookie },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "sliders", label: "Sliders", icon: Image },
  { key: "outlets", label: "Outlets", icon: Store },
  { key: "benefits", label: "Benefits", icon: Gift },
  { key: "units", label: "Units", icon: Ruler },
  { key: "taxes", label: "Taxes", icon: Receipt },
  { key: "pages", label: "Pages", icon: FileText },
  { key: "role_permissions", label: "Role & Permissions", icon: Shield },
  { key: "languages", label: "Languages", icon: Languages },
  { key: "sms_gateway", label: "SMS Gateway", icon: MessageSquare },
  { key: "payment_gateway", label: "Payment Gateway", icon: CreditCard },
  { key: "license", label: "License", icon: Award },
  { key: "footer", label: "Footer", icon: FileText },
];

type FieldDef = {
  key: string;
  label: string;
  type?: "textarea" | "switch" | "image_upload" | "select" | "radio";
  options?: { value: string; label: string }[];
  placeholder?: string;
  fullWidth?: boolean;
};

const sectionFields: Record<string, FieldDef[]> = {
  company: [
    { key: "store_name", label: "Name" },
    { key: "company_latitude", label: "Latitude", placeholder: "23.7699072" },
    { key: "company_longitude", label: "Longitude", placeholder: "90.3643136" },
    { key: "store_email", label: "Email" },
    { key: "store_phone", label: "Phone" },
    { key: "company_website", label: "Website" },
    { key: "company_city", label: "City" },
    { key: "company_state", label: "State" },
    { key: "company_country", label: "Country Code", type: "select", options: [
      { value: "BD", label: "Bangladesh (BGD)" },
      { value: "IN", label: "India (IND)" },
      { value: "US", label: "United States (USA)" },
      { value: "GB", label: "United Kingdom (GBR)" },
      { value: "AE", label: "UAE (ARE)" },
    ]},
    { key: "company_zip", label: "Zip Code" },
    { key: "store_address", label: "Address", type: "textarea", fullWidth: true },
    { key: "company_logo", label: "Logo", type: "image_upload" },
    { key: "company_favicon", label: "Favicon", type: "image_upload" },
  ],
  site: [
    { key: "date_format", label: "Date Format", type: "select", options: [
      { value: "d-m-Y", label: "d-m-Y (20-02-2026)" },
      { value: "Y-m-d", label: "Y-m-d (2026-02-20)" },
      { value: "m/d/Y", label: "m/d/Y (02/20/2026)" },
      { value: "d/m/Y", label: "d/m/Y (20/02/2026)" },
    ]},
    { key: "time_format", label: "Time Format", type: "select", options: [
      { value: "12h", label: "12 Hour (6:47 PM)" },
      { value: "24h", label: "24 Hour (18:47)" },
    ]},
    { key: "default_timezone", label: "Default Timezone", type: "select", options: [
      { value: "Asia/Dhaka", label: "Asia/Dhaka" },
      { value: "Asia/Kolkata", label: "Asia/Kolkata" },
      { value: "UTC", label: "UTC" },
      { value: "America/New_York", label: "America/New_York" },
      { value: "Europe/London", label: "Europe/London" },
    ]},
    { key: "default_language", label: "Default Language", type: "select", options: [
      { value: "en", label: "English" },
      { value: "bn", label: "Bangla" },
      { value: "hi", label: "Hindi" },
      { value: "ar", label: "Arabic" },
    ]},
    { key: "site_copyright", label: "Copyright" },
    { key: "android_app_link", label: "Android App Link" },
    { key: "ios_app_link", label: "iOS App Link" },
    { key: "max_purchase_qty", label: "Non Purchase Product Maximum Quantity" },
    { key: "decimal_point", label: "Digit After Decimal Point (EX: 0.00)" },
    { key: "currency_position", label: "Currency Position", type: "radio", options: [
      { value: "left", label: "(৳) Left" },
      { value: "right", label: "Right (৳)" },
    ]},
    { key: "cod_enabled", label: "Cash On Delivery", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "is_return_credit", label: "Is Return Product Price Add To Credit", type: "radio", options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ]},
    { key: "online_payment_enabled", label: "Online Payment Gateway", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "multi_language_enabled", label: "Language Switch", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "email_verification_enabled", label: "Email Verification", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "phone_verification_enabled", label: "Phone Verification", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "app_debug", label: "App Debug", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "maintenance_mode", label: "Maintenance Mode", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
  ],
  mail: [
    { key: "mail_host", label: "Mail Host" },
    { key: "mail_port", label: "Mail Port" },
    { key: "mail_username", label: "Mail Username" },
    { key: "mail_password", label: "Mail Password" },
    { key: "mail_from_name", label: "Mail From Name" },
    { key: "mail_from_address", label: "Mail From Email" },
    { key: "mail_encryption", label: "Mail Encryption", type: "radio", options: [
      { value: "ssl", label: "SSL" },
      { value: "tls", label: "TLS" },
    ]},
  ],
  otp: [
    { key: "otp_type", label: "OTP Type", type: "select", options: [
      { value: "both", label: "BOTH" },
      { value: "sms", label: "SMS" },
      { value: "email", label: "Email" },
    ]},
    { key: "otp_digit_limit", label: "OTP Digit Limit", type: "select", options: [
      { value: "4", label: "4" },
      { value: "6", label: "6" },
    ]},
    { key: "otp_expire_time", label: "OTP Expire Time", type: "select", options: [
      { value: "5", label: "5 Minutes" },
      { value: "10", label: "10 Minutes" },
      { value: "15", label: "15 Minutes" },
      { value: "30", label: "30 Minutes" },
    ]},
  ],
  social_media: [
    { key: "facebook_url", label: "Facebook" },
    { key: "youtube_url", label: "YouTube" },
    { key: "instagram_url", label: "Instagram" },
    { key: "twitter_url", label: "Twitter" },
    { key: "linkedin_url", label: "LinkedIn" },
    { key: "tiktok_url", label: "TikTok" },
    { key: "whatsapp_number", label: "WhatsApp" },
  ],
  cookies: [
    { key: "cookies_details_page", label: "Cookies Details Page", type: "select", fullWidth: true, options: [
      { value: "", label: "---" },
      { value: "privacy", label: "Privacy Policy" },
      { value: "terms", label: "Terms & Conditions" },
      { value: "cookies", label: "Cookies Policy" },
    ]},
    { key: "cookies_summary", label: "Cookies Summary", type: "textarea", fullWidth: true },
  ],
  analytics: [
    { key: "google_analytics_id", label: "Google Analytics ID" },
    { key: "facebook_pixel_id", label: "Facebook Pixel ID" },
    { key: "google_tag_manager_id", label: "Google Tag Manager ID" },
  ],
  theme: [
    { key: "company_logo", label: "Logo (128PX, 43PX)", type: "image_upload" },
    { key: "company_favicon", label: "Fav Icon (120PX, 120PX)", type: "image_upload" },
    { key: "footer_logo", label: "Footer Logo (144PX, 48PX)", type: "image_upload" },
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
    { key: "about_page_content", label: "About Page Content", type: "textarea", fullWidth: true },
    { key: "terms_page_content", label: "Terms & Conditions", type: "textarea", fullWidth: true },
    { key: "privacy_page_content", label: "Privacy Policy", type: "textarea", fullWidth: true },
    { key: "refund_page_content", label: "Refund Policy", type: "textarea", fullWidth: true },
  ],
  role_permissions: [
    { key: "admin_registration_enabled", label: "Admin Registration", type: "switch" },
    { key: "default_user_role", label: "Default User Role" },
  ],
  languages: [
    { key: "default_language_code", label: "Default Language Code" },
    { key: "multi_language_enabled_setting", label: "Enable Multi Language", type: "switch" },
  ],
  sms_gateway: [], // Handled by custom SmsGatewaySection component
  payment_gateway: [], // Handled by custom PaymentGatewaySection component
  license: [
    { key: "license_code", label: "License Code" },
  ],
  footer: [
    { key: "site_footer_text", label: "Footer Tagline / Description", type: "textarea", fullWidth: true, placeholder: "e.g. Not just a Gift, It's sharing of Love." },
    { key: "site_copyright", label: "Copyright Text", fullWidth: true, placeholder: `© ${new Date().getFullYear()} PikoolyFlora. All Rights Reserved.` },
    { key: "footer_quick_link_1_label", label: "Quick Link 1 Label", placeholder: "About Us" },
    { key: "footer_quick_link_1_url", label: "Quick Link 1 URL", placeholder: "/about" },
    { key: "footer_quick_link_2_label", label: "Quick Link 2 Label", placeholder: "Contact Us" },
    { key: "footer_quick_link_2_url", label: "Quick Link 2 URL", placeholder: "/contact" },
    { key: "footer_quick_link_3_label", label: "Quick Link 3 Label", placeholder: "Privacy Policy" },
    { key: "footer_quick_link_3_url", label: "Quick Link 3 URL", placeholder: "/privacy" },
    { key: "footer_quick_link_4_label", label: "Quick Link 4 Label", placeholder: "Terms & Conditions" },
    { key: "footer_quick_link_4_url", label: "Quick Link 4 URL", placeholder: "/terms" },
    { key: "footer_category_1_label", label: "Category Link 1 Label", placeholder: "Flowers" },
    { key: "footer_category_1_url", label: "Category Link 1 URL", placeholder: "/shop?cat=flowers" },
    { key: "footer_category_2_label", label: "Category Link 2 Label", placeholder: "Cakes" },
    { key: "footer_category_2_url", label: "Category Link 2 URL", placeholder: "/shop?cat=cakes" },
    { key: "footer_category_3_label", label: "Category Link 3 Label", placeholder: "Plants" },
    { key: "footer_category_3_url", label: "Category Link 3 URL", placeholder: "/shop?cat=plants" },
    { key: "footer_category_4_label", label: "Category Link 4 Label", placeholder: "Gift Hampers" },
    { key: "footer_category_4_url", label: "Category Link 4 URL", placeholder: "/shop?cat=gift-hampers" },
    { key: "footer_payment_visa", label: "Show Visa", type: "switch" },
    { key: "footer_payment_mastercard", label: "Show Mastercard", type: "switch" },
    { key: "footer_payment_amex", label: "Show Amex", type: "switch" },
    { key: "footer_payment_paypal", label: "Show PayPal", type: "switch" },
    { key: "footer_payment_stripe", label: "Show Stripe", type: "switch" },
    { key: "footer_payment_bkash", label: "Show bKash", type: "switch" },
    { key: "footer_payment_nagad", label: "Show Nagad", type: "switch" },
    { key: "footer_payment_cod", label: "Show Cash on Delivery", type: "switch" },
  ],
};

// Notification Alert fields per channel
const notificationAlertStatuses = [
  { key: "pending", label: "Order Pending Message", default: "Your order is successfully placed." },
  { key: "confirmed", label: "Order Confirmation Message", default: "Your order is confirmed." },
  { key: "on_the_way", label: "Order On The Way Message", default: "Your order is on the way." },
  { key: "delivered", label: "Order Delivered Message", default: "Your order is successfully delivered." },
  { key: "canceled", label: "Order Canceled Message", default: "Your order is canceled." },
  { key: "rejected", label: "Order Rejected Message", default: "Your order is rejected." },
];

const notificationAlertChannels = ["mail", "sms", "push"];

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
          <img src={value} alt={fieldKey} className="w-24 h-24 object-contain rounded-lg border bg-muted" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
};

// Render a single field
const FieldRenderer = ({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (val: string) => void;
}) => {
  if (field.type === "image_upload") {
    return <ImageUploadField fieldKey={field.key} value={value} onChange={onChange} />;
  }
  if (field.type === "textarea") {
    return (
      <Textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || field.label} />
    );
  }
  if (field.type === "switch") {
    return (
      <div className="flex items-center gap-3 pt-1">
        <Switch checked={value === "true"} onCheckedChange={(c) => onChange(c ? "true" : "false")} />
        <span className="text-sm text-muted-foreground">{value === "true" ? "Enabled" : "Disabled"}</span>
      </div>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "radio" && field.options) {
    return (
      <RadioGroup value={value || field.options[0]?.value} onValueChange={onChange} className="flex items-center gap-4 pt-1">
        {field.options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1.5">
            <RadioGroupItem value={opt.value} id={`${field.key}-${opt.value}`} />
            <Label htmlFor={`${field.key}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }
  return (
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || field.label} />
  );
};

// Notification Alert Section Component
const NotificationAlertSection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: (v: Record<string, string>) => void;
}) => {
  return (
    <Tabs defaultValue="mail">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="mail" className="flex items-center gap-2">
          <Mail className="h-4 w-4" /> Mail
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> SMS
        </TabsTrigger>
        <TabsTrigger value="push" className="flex items-center gap-2">
          <Bell className="h-4 w-4" /> Push Notification
        </TabsTrigger>
      </TabsList>

      {notificationAlertChannels.map((channel) => (
        <TabsContent key={channel} value={channel} className="space-y-4">
          <h4 className="font-medium text-base capitalize">{channel === "push" ? "Push Notification" : channel.charAt(0).toUpperCase() + channel.slice(1)} Notification Messages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationAlertStatuses.map((status) => {
              const msgKey = `alert_${channel}_${status.key}_message`;
              const enableKey = `alert_${channel}_${status.key}_enabled`;
              return (
                <div key={status.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status.label}</label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formValues[enableKey] === "true"}
                        onCheckedChange={(c) => setFormValues({ ...formValues, [enableKey]: c ? "true" : "false" })}
                      />
                      <span className="text-xs text-muted-foreground">{formValues[enableKey] === "true" ? "ON" : "OFF"}</span>
                    </div>
                  </div>
                  <Input
                    value={formValues[msgKey] || status.default}
                    onChange={(e) => setFormValues({ ...formValues, [msgKey]: e.target.value })}
                    placeholder={status.default}
                  />
                </div>
              );
            })}
          </div>
          {/* Admin new order message */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin And Manager New Order Message</label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formValues[`alert_${channel}_admin_new_order_enabled`] === "true"}
                  onCheckedChange={(c) => setFormValues({ ...formValues, [`alert_${channel}_admin_new_order_enabled`]: c ? "true" : "false" })}
                />
                <span className="text-xs text-muted-foreground">{formValues[`alert_${channel}_admin_new_order_enabled`] === "true" ? "ON" : "OFF"}</span>
              </div>
            </div>
            <Input
              value={formValues[`alert_${channel}_admin_new_order_message`] || "You have a new order."}
              onChange={(e) => setFormValues({ ...formValues, [`alert_${channel}_admin_new_order_message`]: e.target.value })}
              placeholder="You have a new order."
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

// SMS Gateway providers config
const smsGatewayProviders = [
  {
    key: "twilio",
    label: "Twilio",
    fields: [
      { key: "twilio_account_sid", label: "Twilio Account SID" },
      { key: "twilio_auth_token", label: "Twilio Auth Token" },
      { key: "twilio_from", label: "Twilio From" },
      { key: "twilio_status", label: "Twilio Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "clickatell",
    label: "Clickatell",
    fields: [
      { key: "clickatell_apikey", label: "Clickatell APIKey" },
      { key: "clickatell_status", label: "Clickatell Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "nexmo",
    label: "Nexmo",
    fields: [
      { key: "nexmo_key", label: "Nexmo Key" },
      { key: "nexmo_secret", label: "Nexmo Secret" },
      { key: "nexmo_status", label: "Nexmo Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
];

const SmsGatewaySection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: (v: Record<string, string>) => void;
}) => {
  return (
    <Tabs defaultValue="twilio">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        {smsGatewayProviders.map((p) => (
          <TabsTrigger key={p.key} value={p.key}>{p.label}</TabsTrigger>
        ))}
      </TabsList>
      {smsGatewayProviders.map((provider) => (
        <TabsContent key={provider.key} value={provider.key} className="space-y-4">
          <h4 className="font-medium text-base">{provider.label}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {provider.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</label>
                {field.type === "select" && field.options ? (
                  <Select value={formValues[field.key] || "disable"} onValueChange={(v) => setFormValues({ ...formValues, [field.key]: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formValues[field.key] || ""}
                    onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Payment Gateway providers config
const paymentGatewayProviders = [
  {
    key: "paypal",
    label: "Paypal",
    fields: [
      { key: "paypal_app_id", label: "Paypal App ID" },
      { key: "paypal_client_id", label: "Paypal Client ID" },
      { key: "paypal_client_secret", label: "Paypal Client Secret" },
      { key: "paypal_mode", label: "Paypal Mode", type: "select" as const, options: [
        { value: "sandbox", label: "Sandbox" },
        { value: "live", label: "Live" },
      ]},
      { key: "paypal_status", label: "Paypal Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "stripe",
    label: "Stripe",
    fields: [
      { key: "stripe_public_key", label: "Stripe Key" },
      { key: "stripe_secret_key", label: "Stripe Secret" },
      { key: "stripe_status", label: "Stripe Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "eps",
    label: "EPS",
    fields: [
      { key: "eps_username", label: "EPS Username (Email)" },
      { key: "eps_password", label: "EPS Password" },
      { key: "eps_merchant_id", label: "EPS Merchant ID" },
      { key: "eps_store_id", label: "EPS Store ID" },
      { key: "eps_hash_key", label: "EPS Hash Key" },
      { key: "eps_mode", label: "EPS Mode", type: "select" as const, options: [
        { value: "sandbox", label: "Sandbox" },
        { value: "live", label: "Live" },
      ]},
      { key: "eps_status", label: "EPS Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
];

const PaymentGatewaySection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: (v: Record<string, string>) => void;
}) => {
  return (
    <Tabs defaultValue="paypal">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        {paymentGatewayProviders.map((p) => (
          <TabsTrigger key={p.key} value={p.key}>{p.label}</TabsTrigger>
        ))}
      </TabsList>
      {paymentGatewayProviders.map((provider) => (
        <TabsContent key={provider.key} value={provider.key} className="space-y-4">
          <h4 className="font-medium text-base">{provider.label}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {provider.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</label>
                {field.type === "select" && field.options ? (
                  <Select value={formValues[field.key] || field.options[0]?.value} onValueChange={(v) => setFormValues({ ...formValues, [field.key]: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formValues[field.key] || ""}
                    onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
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

  // Collect all keys for the active section to save
  const getActiveKeys = () => {
    if (activeSection === "notification_alert") {
      const keys: string[] = [];
      notificationAlertChannels.forEach((ch) => {
        notificationAlertStatuses.forEach((st) => {
          keys.push(`alert_${ch}_${st.key}_message`);
          keys.push(`alert_${ch}_${st.key}_enabled`);
        });
        keys.push(`alert_${ch}_admin_new_order_message`);
        keys.push(`alert_${ch}_admin_new_order_enabled`);
      });
      return keys;
    }
    if (activeSection === "sms_gateway") {
      return smsGatewayProviders.flatMap((p) => p.fields.map((f) => f.key));
    }
    if (activeSection === "payment_gateway") {
      return paymentGatewayProviders.flatMap((p) => p.fields.map((f) => f.key));
    }
    return (sectionFields[activeSection] || []).map((f) => f.key);
  };

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, string>) => {
      const keys = getActiveKeys();
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
  const currentSection = settingSections.find((s) => s.key === activeSection);
  const SectionIcon = currentSection?.icon || Settings;

  return (
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
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-card border rounded-lg">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SectionIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{currentSection?.label}</h3>
                  </div>
                  <Button type="submit" size="sm" disabled={saveMutation.isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>

                <div className="p-4">
                  {activeSection === "notification_alert" ? (
                    <NotificationAlertSection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "sms_gateway" ? (
                    <SmsGatewaySection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "payment_gateway" ? (
                    <PaymentGatewaySection formValues={formValues} setFormValues={setFormValues} />
                  ) : currentFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">No settings available for this section yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {currentFields.map((field) => (
                        <div key={field.key} className={cn("space-y-1.5", field.fullWidth && "md:col-span-2")}>
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</label>
                          <FieldRenderer
                            field={field}
                            value={formValues[field.key] || ""}
                            onChange={(val) => setFormValues({ ...formValues, [field.key]: val })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
