import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import RichTextEditor from "@/components/admin/RichTextEditor";
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
  Settings, Upload, X, Phone, Cloud,
  Store, Gift, Ruler, Receipt, FileText, Shield, Languages,
  MessageSquare, CreditCard, Award, Star, ShoppingCart,
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
  { key: "languages", label: "Languages", icon: Languages },
  { key: "sms_gateway", label: "SMS Gateway", icon: MessageSquare },
  { key: "payment_gateway", label: "Payment Gateway", icon: CreditCard },
  { key: "about", label: "About Section", icon: FileText },
  { key: "pages", label: "Pages", icon: FileText },
  { key: "faq", label: "FAQ Section", icon: MessageSquare },
  { key: "push_notification", label: "Push Notification", icon: Bell },
  { key: "social_login", label: "Social Login", icon: Share2 },
  { key: "license", label: "License", icon: Award },
  { key: "footer", label: "Footer", icon: FileText },
  { key: "cloudinary", label: "Cloudinary", icon: Cloud },
  { key: "checkout", label: "Checkout", icon: CreditCard },
  { key: "cart_page", label: "Cart Page", icon: ShoppingCart },
];

type FieldDef = {
  key: string;
  label: string;
  type?: "textarea" | "switch" | "image_upload" | "select" | "radio" | "richtext";
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
    { key: "admin_notification_email", label: "Admin Notification Email", placeholder: "admin@yourstore.com (for new order alerts)" },
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
  ],
  site: [
    { key: "announcement_bar_enabled", label: "Announcement Bar", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "announcement_bar_text", label: "Announcement Bar Text", placeholder: "🌸 Same Day Delivery Available in 500+ Cities" },
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
    { key: "order_whatsapp_number", label: "Order WhatsApp Number", placeholder: "+8801XXXXXXXXX" },
    { key: "order_phone_number", label: "Call For Order Number", placeholder: "+8801XXXXXXXXX" },
  ],
  cookies: [
    { key: "cookies_details_page", label: "Cookies Details Page", type: "select", fullWidth: true, options: [
      { value: "none", label: "---" },
      { value: "privacy", label: "Privacy Policy" },
      { value: "terms", label: "Terms & Conditions" },
      { value: "cookies", label: "Cookies Policy" },
    ]},
    { key: "cookies_summary", label: "Cookies Summary", type: "textarea", fullWidth: true },
  ],
  analytics: [
    { key: "google_analytics_id", label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX" },
    { key: "facebook_pixel_id", label: "Facebook Pixel ID", placeholder: "123456789012345" },
    { key: "google_tag_manager_id", label: "Google Tag Manager ID", placeholder: "GTM-XXXXXXX" },
    { key: "google_maps_api_key", label: "Google Maps API Key", placeholder: "AIzaSy...", fullWidth: true },
  ],
  theme: [
    { key: "company_logo", label: "Logo (128PX, 43PX)", type: "image_upload" },
    { key: "company_favicon", label: "Fav Icon (120PX, 120PX)", type: "image_upload" },
    { key: "footer_logo", label: "Footer Logo (144PX, 48PX)", type: "image_upload" },
    { key: "homepage_banner_image", label: "Homepage Banner (Below Hero)", type: "image_upload", fullWidth: true },
    { key: "homepage_banner_link", label: "Homepage Banner Link (optional)", placeholder: "/shop or https://..." },
    { key: "homepage_banner_enabled", label: "Show Homepage Banner", type: "switch" },
  ],
  sliders: [], // Handled by custom SlidersSection component
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
  languages: [], // Handled by custom LanguagesSection component
  sms_gateway: [], // Handled by custom SmsGatewaySection component
  payment_gateway: [], // Handled by custom PaymentGatewaySection component
  push_notification: [
    { key: "push_enabled", label: "Enable Push Notifications", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "vapid_public_key", label: "VAPID Public Key", fullWidth: true, placeholder: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-..." },
    { key: "vapid_private_key", label: "VAPID Private Key", fullWidth: true, placeholder: "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG97jDFlnyYxa8" },
    { key: "vapid_subject", label: "VAPID Subject (mailto: or URL)", fullWidth: true, placeholder: "mailto:admin@pikoolyflora.com" },
    { key: "push_new_order_enabled", label: "New Order Notification", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
    { key: "push_offer_enabled", label: "Offer/Promo Notification", type: "radio", options: [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ]},
  ],
  license: [
    { key: "license_code", label: "License Code" },
  ],
  about: [
    { key: "homepage_seo_title", label: "Homepage SEO Title (Google Title)", fullWidth: true, placeholder: "PikoolyFlora – Online Flower, Cake & Gift Delivery in Bangladesh" },
    { key: "homepage_meta_description", label: "Homepage Meta Description (Google Snippet)", type: "textarea", fullWidth: true, placeholder: "Order fresh flowers, cakes & gifts online in Bangladesh. Same-day delivery in Dhaka. Best prices guaranteed. 🌸" },
    { key: "about_title", label: "About Title", fullWidth: true, placeholder: "PikoolyFlora: Online Flower Shop in Bangladesh" },
    { key: "about_short_text", label: "Short Text (before Read more)", type: "richtext", fullWidth: true, placeholder: "Welcome to PikoolyFlora-Online website..." },
    { key: "about_full_text", label: "Full Text (after Read more)", type: "richtext", fullWidth: true, placeholder: "Extended description shown after clicking Read more..." },
  ],
  about_page: [
    { key: "aboutpage_hero_title", label: "Hero Title", fullWidth: true, placeholder: "Your Trusted Online Flower Shop in Bangladesh" },
    { key: "aboutpage_hero_subtitle", label: "Hero Subtitle", fullWidth: true, placeholder: "Fresh flowers, beautiful bouquets, and reliable same-day delivery..." },
    { key: "aboutpage_welcome_text", label: "Welcome Text", type: "richtext", fullWidth: true, placeholder: "Pikooly is an online flower, cake, and gift delivery platform..." },
    { key: "aboutpage_tagline", label: "Tagline", placeholder: "Pikooly – Bringing Blooms, Spreading Smiles." },
    { key: "aboutpage_founder_name", label: "Founder Name", placeholder: "Md Ripon" },
    { key: "aboutpage_founder_title", label: "Founder Title", placeholder: "Founder & CEO" },
    { key: "aboutpage_founder_desc", label: "Founder Description", type: "textarea", fullWidth: true, placeholder: "Pikooly was founded by Md Ripon..." },
    { key: "aboutpage_founder_image", label: "Founder Image", type: "image_upload" },
    { key: "aboutpage_whoweare_1", label: "Who We Are – Paragraph 1", type: "textarea", fullWidth: true, placeholder: "Pikooly is built in Bangladesh..." },
    { key: "aboutpage_whoweare_2", label: "Who We Are – Paragraph 2", type: "textarea", fullWidth: true, placeholder: "We believe that flowers are not just products..." },
    { key: "aboutpage_value_1_title", label: "Value 1 Title", placeholder: "Freshness First" },
    { key: "aboutpage_value_1_desc", label: "Value 1 Description", placeholder: "Every flower is hand-picked and arranged fresh..." },
    { key: "aboutpage_value_2_title", label: "Value 2 Title", placeholder: "Price Transparency" },
    { key: "aboutpage_value_2_desc", label: "Value 2 Description", placeholder: "Clear, honest pricing with no hidden charges..." },
    { key: "aboutpage_value_3_title", label: "Value 3 Title", placeholder: "Reliable Delivery" },
    { key: "aboutpage_value_3_desc", label: "Value 3 Description", placeholder: "Same-day delivery across Dhaka..." },
    { key: "aboutpage_value_4_title", label: "Value 4 Title", placeholder: "Customer Trust" },
    { key: "aboutpage_value_4_desc", label: "Value 4 Description", placeholder: "We value long-term relationships..." },
    { key: "aboutpage_mission_intro", label: "Mission Intro", type: "textarea", fullWidth: true, placeholder: "Our mission is to help people in Bangladesh..." },
    { key: "aboutpage_mission_item_1", label: "Mission Item 1", placeholder: "Deliver fresh flowers on time" },
    { key: "aboutpage_mission_item_2", label: "Mission Item 2", placeholder: "Offer clear and fair pricing" },
    { key: "aboutpage_mission_item_3", label: "Mission Item 3", placeholder: "Keep the ordering process easy" },
    { key: "aboutpage_mission_item_4", label: "Mission Item 4", placeholder: "Maintain trust with every customer" },
    { key: "aboutpage_mission_closing", label: "Mission Closing Text", type: "textarea", fullWidth: true, placeholder: "Whether it is a birthday, anniversary..." },
    { key: "aboutpage_offering_1", label: "Offering 1", placeholder: "Fresh flower bouquets (Rose, Lily, Tulip, Mixed)" },
    { key: "aboutpage_offering_2", label: "Offering 2", placeholder: "Same-day flower delivery in Dhaka" },
    { key: "aboutpage_offering_3", label: "Offering 3", placeholder: "Next-day flower delivery across Bangladesh" },
    { key: "aboutpage_offering_4", label: "Offering 4", placeholder: "Cakes and desserts from trusted bakeries" },
    { key: "aboutpage_offering_5", label: "Offering 5", placeholder: "Gift hampers and combo packages" },
    { key: "aboutpage_offering_6", label: "Offering 6", placeholder: "Occasion-based gifts for birthdays & anniversaries" },
    { key: "aboutpage_serving_text", label: "Serving Bangladesh Text", type: "textarea", fullWidth: true, placeholder: "Pikooly primarily serves Dhaka and selected cities..." },
    { key: "aboutpage_contact_phone", label: "Contact Phone", placeholder: "+8801410244421" },
    { key: "aboutpage_contact_website", label: "Contact Website URL", placeholder: "https://pikooly.com.bd" },
    { key: "aboutpage_contact_website_label", label: "Contact Website Label", placeholder: "pikooly.com.bd" },
  ],
  contact_page: [
    { key: "contactpage_hero_title", label: "Hero Title", fullWidth: true, placeholder: "Contact Us" },
    { key: "contactpage_hero_subtitle", label: "Hero Subtitle", type: "textarea", fullWidth: true, placeholder: "Have a query? Need assistance? Simply reach out..." },
    { key: "contactpage_whatsapp", label: "WhatsApp Number", placeholder: "+8801410244421" },
    { key: "contactpage_whatsapp_text", label: "WhatsApp Heading", placeholder: "Fastest way to reach us." },
    { key: "contactpage_email", label: "Email Address", placeholder: "hello.pikooly@gmail.com" },
    { key: "contactpage_phone_1", label: "Phone Number 1", placeholder: "+8801410244421" },
    { key: "contactpage_phone_2", label: "Phone Number 2 (optional)", placeholder: "" },
    { key: "contactpage_phone_hours", label: "Phone Hours", placeholder: "9 AM to 10 PM throughout the week" },
    { key: "contactpage_address", label: "Address", type: "textarea", fullWidth: true, placeholder: "House 95, Road 06, Sector 9, Uttara, Dhaka 1230" },
    { key: "contactpage_website_url", label: "Website URL", placeholder: "https://pikooly.com.bd" },
    { key: "contactpage_website_label", label: "Website Label", placeholder: "pikooly.com.bd" },
  ],
  refund_policy: [
    { key: "refundpage_title", label: "Page Title", fullWidth: true, placeholder: "Refund & Return Policy" },
    { key: "refundpage_subtitle", label: "Page Subtitle", fullWidth: true, placeholder: "Our commitment to your satisfaction" },
    { key: "refundpage_content", label: "Page Content", type: "richtext", fullWidth: true, placeholder: "Write your full refund & return policy here..." },
  ],
  privacy_policy: [
    { key: "privacypage_title", label: "Page Title", fullWidth: true, placeholder: "Privacy Policy" },
    { key: "privacypage_subtitle", label: "Page Subtitle", fullWidth: true, placeholder: "How we protect and use your information" },
    { key: "privacypage_content", label: "Page Content", type: "richtext", fullWidth: true, placeholder: "Write your full privacy policy here..." },
  ],
  terms_conditions: [
    { key: "termspage_title", label: "Page Title", fullWidth: true, placeholder: "Terms & Conditions" },
    { key: "termspage_subtitle", label: "Page Subtitle", fullWidth: true, placeholder: "Please read carefully before using our service" },
    { key: "termspage_content", label: "Page Content", type: "richtext", fullWidth: true, placeholder: "Write your full terms & conditions here..." },
  ],
  faq: [
    { key: "faq_section_title", label: "Section Title", placeholder: "Frequently Asked Questions" },
    { key: "faq_section_subtitle", label: "Section Subtitle", placeholder: "Everything you need to know about our services" },
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
    { key: "footer_category_1_url", label: "Category Link 1 URL", placeholder: "/product-category/flowers" },
    { key: "footer_category_2_label", label: "Category Link 2 Label", placeholder: "Cakes" },
    { key: "footer_category_2_url", label: "Category Link 2 URL", placeholder: "/product-category/cakes" },
    { key: "footer_category_3_label", label: "Category Link 3 Label", placeholder: "Plants" },
    { key: "footer_category_3_url", label: "Category Link 3 URL", placeholder: "/product-category/plants" },
    { key: "footer_category_4_label", label: "Category Link 4 Label", placeholder: "Gift Hampers" },
    { key: "footer_category_4_url", label: "Category Link 4 URL", placeholder: "/product-category/gift-hampers" },
    { key: "footer_payment_visa", label: "Show Visa", type: "switch" },
    { key: "footer_payment_mastercard", label: "Show Mastercard", type: "switch" },
    { key: "footer_payment_amex", label: "Show Amex", type: "switch" },
    { key: "footer_payment_paypal", label: "Show PayPal", type: "switch" },
    { key: "footer_payment_stripe", label: "Show Stripe", type: "switch" },
    { key: "footer_payment_bkash", label: "Show bKash", type: "switch" },
    { key: "footer_payment_nagad", label: "Show Nagad", type: "switch" },
    { key: "footer_payment_cod", label: "Show Cash on Delivery", type: "switch" },
  ],
  trending_tabs: [
    { key: "trending_tab_foryou_icon", label: "For You Tab Icon", type: "image_upload" as const },
    { key: "trending_tab_bestseller_icon", label: "Best Seller Tab Icon", type: "image_upload" as const },
  ],
  bouquet_seo: [
    { key: "bouquet_seo_title", label: "SEO Title", placeholder: "Custom Flower Bouquet Builder | Design Your Own Bouquet - Pikooly" },
    { key: "bouquet_seo_description", label: "Meta Description", type: "textarea" as const, placeholder: "Create your perfect custom flower bouquet online...", fullWidth: true },
    { key: "bouquet_seo_og_image", label: "OG Image", type: "image_upload" as const },
    { key: "bouquet_seo_jsonld_name", label: "Schema Name", placeholder: "Custom Flower Bouquet Builder - Pikooly" },
    { key: "bouquet_seo_jsonld_description", label: "Schema Description", type: "textarea" as const, placeholder: "Design your own custom flower bouquet online...", fullWidth: true },
  ],
  cloudinary: [
    { key: "cloudinary_cloud_name", label: "Cloud Name", placeholder: "Your Cloudinary cloud name" },
    { key: "cloudinary_api_key", label: "API Key", placeholder: "Your Cloudinary API key" },
    { key: "cloudinary_api_secret", label: "API Secret", placeholder: "Your Cloudinary API secret" },
  ],
  checkout: [
    { key: "checkout_billing_visible", label: "Show Billing Details Section", type: "radio", options: [
      { value: "true", label: "Show" },
      { value: "false", label: "Hide" },
    ]},
    { key: "checkout_delivery_date_visible", label: "Show Delivery Date & Time", type: "radio", options: [
      { value: "true", label: "Show" },
      { value: "false", label: "Hide" },
    ]},
  ],
  cart_page: [
    { key: "cart_express_section_enabled", label: "Show Express Delivery Cards", type: "switch" },
    { key: "cart_express_heading", label: "Express Delivery Heading", placeholder: "Express Delivery" },
    { key: "cart_addons_enabled", label: "Show Last-Minute Add-ons Section", type: "switch" },
    { key: "cart_addons_heading", label: "Add-ons Section Heading", placeholder: "Your last minute add-ons" },
    { key: "cart_savings_enabled", label: "Show Savings Banner", type: "switch" },
    { key: "cart_savings_heading", label: "Savings Banner Text (use {amount})", placeholder: "You have saved {amount} on this order", fullWidth: true },
    { key: "cart_bill_summary_enabled", label: "Show Bill Summary", type: "switch" },
    { key: "cart_bill_summary_heading", label: "Bill Summary Heading", placeholder: "Bill Summary" },
    { key: "cart_accent_color", label: "Accent Color (hex)", placeholder: "#0a4d5c" },
    { key: "cart_addons_bg_color", label: "Add-ons Background Color (hex)", placeholder: "#fde9d9" },
    { key: "cart_savings_bg_color", label: "Savings Banner Background (hex)", placeholder: "#d4edf7" },
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
      const { convertToWebP } = await import("@/lib/imageUtils");
      const webpFile = await convertToWebP(file);
      const filePath = `settings/${fieldKey}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, webpFile, { upsert: true, contentType: "image/webp" });
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
  if (field.type === "richtext") {
    return <RichTextEditor value={value} onChange={onChange} />;
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
    const effectiveValue = value || field.options[0]?.value || "";
    return (
      <RadioGroup value={effectiveValue} onValueChange={onChange} className="flex items-center gap-4 pt-1">
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
      <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
        <TabsTrigger value="mail" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
          <Mail className="h-3.5 w-3.5 shrink-0" /> Mail
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" /> SMS
        </TabsTrigger>
        <TabsTrigger value="push" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
          <Bell className="h-3.5 w-3.5 shrink-0" /> Push
        </TabsTrigger>
      </TabsList>

      {notificationAlertChannels.map((channel) => (
        <TabsContent key={channel} value={channel} className="space-y-4">
          <h4 className="font-medium text-base capitalize">{channel === "push" ? "Push Notification" : channel.charAt(0).toUpperCase() + channel.slice(1)} Notification Messages</h4>
          <div className="grid grid-cols-1 gap-4">
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

// Social Login providers config
const socialLoginProviders = [
  {
    key: "google",
    label: "Google",
    supported: true,
    fields: [
      { key: "social_google_client_id", label: "Google Client ID" },
      { key: "social_google_client_secret", label: "Google Client Secret" },
      { key: "social_google_status", label: "Google Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "apple",
    label: "Apple",
    supported: true,
    fields: [
      { key: "social_apple_client_id", label: "Apple Client ID" },
      { key: "social_apple_client_secret", label: "Apple Client Secret" },
      { key: "social_apple_status", label: "Apple Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    supported: false,
    fields: [
      { key: "social_facebook_app_id", label: "Facebook App ID" },
      { key: "social_facebook_app_secret", label: "Facebook App Secret" },
      { key: "social_facebook_status", label: "Facebook Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
  {
    key: "phone",
    label: "Phone",
    supported: false,
    fields: [
      { key: "social_phone_otp_provider", label: "OTP Provider" },
      { key: "social_phone_status", label: "Phone Login Status", type: "select" as const, options: [
        { value: "enable", label: "Enable" },
        { value: "disable", label: "Disable" },
      ]},
    ],
  },
];

const SocialLoginSection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: (v: Record<string, string>) => void;
}) => {
  return (
    <Tabs defaultValue="google">
      <TabsList className="w-full grid grid-cols-4 mb-4 h-auto">
        {socialLoginProviders.map((p) => (
          <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm px-2 py-2 relative">
            {p.label}
            {!p.supported && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-muted text-muted-foreground px-1 rounded-full leading-tight">Soon</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {socialLoginProviders.map((provider) => (
        <TabsContent key={provider.key} value={provider.key} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-base">{provider.label}</h4>
            {!provider.supported && (
              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            )}
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4", !provider.supported && "opacity-50 pointer-events-none")}>
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


const TestGoogleMapsKeyButton = ({ apiKey }: { apiKey: string }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; message: string }>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    const key = (apiKey || "").trim();
    if (!key) {
      toast({ title: "No key", description: "Please enter a Google Maps API Key first.", variant: "destructive" });
      return;
    }
    setTesting(true);
    setResult(null);

    // Load Maps JS in an isolated way; listen for gm_authFailure (invalid/restricted key)
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (ok: boolean, message: string) => {
        if (settled) return;
        settled = true;
        setResult({ ok, message });
        if (ok) toast({ title: "Key works ✅", description: message });
        else toast({ title: "Key failed ❌", description: message, variant: "destructive" });
        resolve();
      };

      // gm_authFailure fires when key is invalid / referrer blocked / billing issue
      (window as any).gm_authFailure = () => finish(false, "Google rejected this key (invalid, restricted, or billing not enabled).");

      // Use a unique callback to verify the script actually initialized
      const cbName = `__gmapsTest_${Date.now()}`;
      (window as any)[cbName] = () => {
        try {
          const ok = !!(window as any).google?.maps?.places?.Autocomplete;
          finish(ok, ok ? "Maps JS + Places library loaded successfully." : "Maps loaded but Places library missing. Enable Places API.");
        } catch {
          finish(false, "Maps loaded but Places library not available.");
        } finally {
          delete (window as any)[cbName];
        }
      };

      // If script already cached for a previous key, force a fresh script tag
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${cbName}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => finish(false, "Failed to load Google Maps script (network or key blocked).");
      document.head.appendChild(script);

      // Safety timeout
      setTimeout(() => finish(false, "Timed out waiting for Google Maps. Key may be blocked or referrer-restricted."), 8000);
    });

    setTesting(false);
  };

  return (
    <div className="mt-2 rounded-lg border border-border p-4 bg-muted/30">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">Validate Google Maps API Key</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tests if the key loads Maps JS + Places (used for address autocomplete).</p>
        </div>
        <Button type="button" onClick={handleTest} disabled={testing} variant="outline" size="sm">
          {testing ? "Testing..." : "Test Key"}
        </Button>
      </div>
      {result && (
        <div className={cn(
          "mt-3 text-xs rounded-md px-3 py-2 border",
          result.ok
            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300"
        )}>
          {result.ok ? "✅ " : "❌ "}{result.message}
        </div>
      )}
    </div>
  );
};

const SendTestEmailButton = () => {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail.trim(),
          subject: "PikoolyFlora - Test Email",
          html: `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#e85d5d;">🎉 Mail Configuration Working!</h2><p>This is a test email from <strong>PikoolyFlora</strong> Admin Panel.</p><p>Your SMTP settings are configured correctly.</p><hr/><p style="color:#999;font-size:12px;">PikoolyFlora - Not just a Gift, It's sharing of Love.</p></div>`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "✓ Test email sent successfully!" });
      setTestEmail("");
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Send Test Email</label>
      <div className="flex gap-2 mt-1.5">
        <Input
          type="email"
          placeholder="recipient@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleSendTest} disabled={sending}>
          <Mail className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : "Send Test"}
        </Button>
      </div>
    </div>
  );
};

// Sliders Section - uses dedicated sliders table
const SlidersSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: sliders = [], isLoading } = useQuery({
    queryKey: ["admin-sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const [localSliders, setLocalSliders] = useState<any[]>([]);

  useEffect(() => {
    if (sliders.length > 0) setLocalSliders(sliders);
  }, [sliders]);

  const handleImageUpload = async (sliderId: string, file: File) => {
    setUploading(sliderId);
    try {
      const { convertToWebP } = await import("@/lib/imageUtils");
      const webpFile = await convertToWebP(file);
      const filePath = `slider-${sliderId}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("sliders")
        .upload(filePath, webpFile, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("sliders").getPublicUrl(filePath);
      setLocalSliders((prev) =>
        prev.map((s) => (s.id === sliderId ? { ...s, image_url: urlData.publicUrl } : s))
      );
      toast({ title: "Image uploaded ✓" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const updateField = (id: string, field: string, value: string) => {
    setLocalSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = localSliders.map((s) =>
        supabase
          .from("sliders")
          .update({
            title: s.title,
            subtitle: s.subtitle,
            image_url: s.image_url,
            bg_image_url: s.bg_image_url || null,
            link: s.link,
            bg_color: s.bg_color,
            cta_text: s.cta_text,
            display_order: s.display_order,
            is_active: s.is_active,
          })
          .eq("id", s.id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sliders"] });
      qc.invalidateQueries({ queryKey: ["sliders"] });
      toast({ title: "Sliders saved ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSlider = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sliders").insert({
        title: "New Slider",
        display_order: localSliders.length,
        bg_color: "#d4e8d0",
        cta_text: "ORDER NOW",
        link: "/shop",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sliders"] });
      toast({ title: "Slider added ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSlider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sliders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sliders"] });
      toast({ title: "Slider deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm py-4 text-center">Loading sliders...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage homepage hero sliders</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addSlider.mutate()} disabled={addSlider.isPending}>
            + Add Slider
          </Button>
          <Button type="button" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {localSliders.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No sliders yet. Click "Add Slider" to create one.</p>
      ) : (
        localSliders.map((slider, idx) => (
          <div key={slider.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Slider {idx + 1}</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={slider.is_active !== false}
                    onCheckedChange={(c) => updateField(slider.id, "is_active", c ? "true" : "false")}
                  />
                  <span className="text-xs text-muted-foreground">{slider.is_active !== false ? "Active" : "Inactive"}</span>
                </div>
                <Button type="button" variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteSlider.mutate(slider.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Image */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image</label>
                {slider.image_url && (
                  <div className="relative inline-block">
                    <img src={slider.image_url} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => updateField(slider.id, "image_url", "")}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => fileRefs.current[slider.id]?.click()}
                    disabled={uploading === slider.id}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading === slider.id ? "Uploading..." : "Upload Image"}
                  </Button>
                  <input
                    ref={(el) => { fileRefs.current[slider.id] = el; }}
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(slider.id, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Subtitle (small text) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Small Text</label>
                <Input value={slider.subtitle || ""} onChange={(e) => updateField(slider.id, "subtitle", e.target.value)} placeholder="Fresh & Real" />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
                <Input value={slider.title || ""} onChange={(e) => updateField(slider.id, "title", e.target.value)} placeholder="Slider Title" />
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link</label>
                <Input value={slider.link || ""} onChange={(e) => updateField(slider.id, "link", e.target.value)} placeholder="/shop" />
              </div>

              {/* CTA Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CTA Text</label>
                <Input value={slider.cta_text || ""} onChange={(e) => updateField(slider.id, "cta_text", e.target.value)} placeholder="ORDER NOW" />
              </div>

              {/* Background Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Background Image (Full Banner)</label>
                {slider.bg_image_url && (
                  <div className="relative inline-block">
                    <img src={slider.bg_image_url} alt="" className="w-32 h-16 object-cover rounded-lg border" />
                    <button type="button" onClick={() => updateField(slider.id, "bg_image_url", "")}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        setUploading(slider.id + "-bg");
                        try {
                          const { convertToWebP } = await import("@/lib/imageUtils");
                          const webpFile = await convertToWebP(file);
                          const filePath = `slider-bg-${slider.id}-${Date.now()}.webp`;
                          const { error: uploadError } = await supabase.storage.from("sliders").upload(filePath, webpFile, { upsert: true, contentType: "image/webp" });
                          if (uploadError) throw uploadError;
                          const { data: urlData } = supabase.storage.from("sliders").getPublicUrl(filePath);
                          setLocalSliders((prev) => prev.map((s) => (s.id === slider.id ? { ...s, bg_image_url: urlData.publicUrl } : s)));
                          toast({ title: "Background uploaded ✓" });
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                        } finally {
                          setUploading(null);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading === slider.id + "-bg"}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading === slider.id + "-bg" ? "Uploading..." : "Upload BG Image"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1">If set, text overlays on the full image (like FnP style)</p>
                </div>
              </div>

              {/* BG Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Background Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={slider.bg_color || "#d4e8d0"}
                    onChange={(e) => updateField(slider.id, "bg_color", e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={slider.bg_color || ""} onChange={(e) => updateField(slider.id, "bg_color", e.target.value)}
                    placeholder="#d4e8d0" className="max-w-[140px]" />
                </div>
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display Order</label>
                <Input type="number" value={slider.display_order ?? idx}
                  onChange={(e) => updateField(slider.id, "display_order", e.target.value)}
                  placeholder="0" className="max-w-[100px]" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Dynamic FAQ Section with unlimited add/remove
const DynamicFAQSection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: (v: Record<string, string>) => void;
}) => {
  // Parse existing FAQ items from formValues
  const faqIndices = useMemo(() => {
    const indices = new Set<number>();
    Object.keys(formValues).forEach((k) => {
      const match = k.match(/^faq_(\d+)_question$/);
      if (match) indices.add(parseInt(match[1]));
    });
    return Array.from(indices).sort((a, b) => a - b);
  }, [formValues]);

  const addFaq = () => {
    const nextIndex = faqIndices.length > 0 ? Math.max(...faqIndices) + 1 : 1;
    setFormValues({
      ...formValues,
      [`faq_${nextIndex}_question`]: "",
      [`faq_${nextIndex}_answer`]: "",
    });
  };

  const removeFaq = (index: number) => {
    const updated = { ...formValues };
    delete updated[`faq_${index}_question`];
    delete updated[`faq_${index}_answer`];
    setFormValues(updated);
  };

  return (
    <div className="space-y-4">
      {/* Section title & subtitle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {(sectionFields["faq"] || []).map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</label>
            <Input
              value={formValues[field.key] || ""}
              onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
              placeholder={field.placeholder || field.label}
            />
          </div>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4 mt-4">
        {faqIndices.map((idx, pos) => (
          <div key={idx} className="border border-border rounded-lg p-4 bg-muted/30 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">FAQ {pos + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(idx)} className="text-destructive hover:text-destructive h-7 px-2">
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question</label>
                <Input
                  value={formValues[`faq_${idx}_question`] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [`faq_${idx}_question`]: e.target.value })}
                  placeholder={`FAQ ${pos + 1} Question`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer</label>
                <Textarea
                  rows={3}
                  value={formValues[`faq_${idx}_answer`] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [`faq_${idx}_answer`]: e.target.value })}
                  placeholder={`FAQ ${pos + 1} Answer`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addFaq} className="w-full border-dashed">
        + Add FAQ
      </Button>
    </div>
  );
};

// Languages Section
const LanguagesSection = ({
  formValues,
  setFormValues,
}: {
  formValues: Record<string, string>;
  setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => {
  const allLanguages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "th", name: "Thai", nativeName: "ไทย" },
  ];

  const defaultLang = formValues["default_language_code"] || "en";
  const multiEnabled = formValues["multi_language_enabled_setting"] === "true";

  // Parse enabled languages from comma-separated string
  const enabledLangs = (formValues["enabled_languages"] || "en").split(",").filter(Boolean);

  const toggleLanguage = (code: string) => {
    let updated: string[];
    if (enabledLangs.includes(code)) {
      // Can't disable default language
      if (code === defaultLang) return;
      updated = enabledLangs.filter((c) => c !== code);
    } else {
      updated = [...enabledLangs, code];
    }
    setFormValues((prev) => ({ ...prev, enabled_languages: updated.join(",") }));
  };

  return (
    <div className="space-y-6">
      {/* Default Language */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Default Language Code</label>
        <Select
          value={defaultLang}
          onValueChange={(v) => {
            setFormValues((prev) => ({
              ...prev,
              default_language_code: v,
              // Ensure default language is always enabled
              enabled_languages: prev["enabled_languages"]?.includes(v)
                ? prev["enabled_languages"]
                : [...(prev["enabled_languages"] || "en").split(",").filter(Boolean), v].join(","),
            }));
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {allLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enable Multi Language Toggle */}
      <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium">Enable Multi Language</p>
          <p className="text-xs text-muted-foreground">Allow users to switch languages on the frontend</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{multiEnabled ? "Enabled" : "Disabled"}</span>
          <Switch
            checked={multiEnabled}
            onCheckedChange={(checked) =>
              setFormValues((prev) => ({ ...prev, multi_language_enabled_setting: checked ? "true" : "false" }))
            }
          />
        </div>
      </div>

      {/* Language List */}
      {multiEnabled && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available Languages</label>
          <p className="text-xs text-muted-foreground mb-2">Toggle languages users can switch to. Default language cannot be disabled.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allLanguages.map((lang) => {
              const isEnabled = enabledLangs.includes(lang.code);
              const isDefault = lang.code === defaultLang;
              return (
                <div
                  key={lang.code}
                  className={cn(
                    "flex items-center justify-between border rounded-lg px-3 py-2.5 transition-colors",
                    isEnabled ? "border-primary/40 bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                      {lang.code}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{lang.name}</p>
                      <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDefault && (
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">Default</span>
                    )}
                    <Switch
                      checked={isEnabled}
                      disabled={isDefault}
                      onCheckedChange={() => toggleLanguage(lang.code)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
    if (activeSection === "faq") {
      const base = (sectionFields["faq"] || []).map((f) => f.key);
      const dynamicKeys = Object.keys(formValues).filter((k) => /^faq_\d+_(question|answer)$/.test(k));
      return [...new Set([...base, ...dynamicKeys])];
    }
    if (activeSection === "about") {
      const base = (sectionFields["about"] || []).map((f) => f.key);
      const faqBase = (sectionFields["faq"] || []).map((f) => f.key);
      const dynamicKeys = Object.keys(formValues).filter((k) => /^faq_\d+_(question|answer)$/.test(k));
      return [...new Set([...base, ...faqBase, ...dynamicKeys])];
    }
    if (activeSection === "languages") {
      return ["default_language_code", "multi_language_enabled_setting", "enabled_languages"];
    }
    if (activeSection === "social_login") {
      return socialLoginProviders.flatMap((p) => p.fields.map((f) => f.key));
    }
    return (sectionFields[activeSection] || []).map((f) => f.key);
  };

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, string>) => {
      const keys = getActiveKeys();
      // For radio fields, use the default (first option) if value is empty
      const fields = sectionFields[activeSection] || [];
      const promises = keys.map(async (key) => {
        let value = vals[key] || "";
        // If the field is a radio and value is empty, use the first option as default
        const fieldDef = fields.find((f) => f.key === key);
        if (fieldDef?.type === "radio" && !value && fieldDef.options?.length) {
          value = fieldDef.options[0].value;
        }
        const existing = settings.find((s: any) => s.key === key);
        if (existing) {
          return supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          return supabase.from("site_settings").insert({ key, value });
        }
      });

      // For FAQ section (or About which embeds FAQs), also delete removed FAQ keys from DB
      if (activeSection === "faq" || activeSection === "about") {
        const dbFaqKeys = settings
          .filter((s: any) => /^faq_\d+_(question|answer)$/.test(s.key))
          .map((s: any) => s.key);
        const removedKeys = dbFaqKeys.filter((k: string) => !(k in vals));
        if (removedKeys.length > 0) {
          promises.push(
            supabase.from("site_settings").delete().in("key", removedKeys) as any
          );
        }
      }

      const results = await Promise.all(promises);
      const err = results.find((r: any) => r.error);
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
            <div className="bg-card border rounded-lg p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="space-y-2"><div className="h-4 w-32 bg-muted rounded animate-pulse" /><div className="h-10 w-full bg-muted rounded-lg animate-pulse" /></div>)}</div>
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
                  {activeSection === "sliders" ? (
                    <SlidersSection />
                  ) : activeSection === "notification_alert" ? (
                    <NotificationAlertSection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "sms_gateway" ? (
                    <SmsGatewaySection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "payment_gateway" ? (
                    <PaymentGatewaySection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "faq" ? (
                    <DynamicFAQSection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "languages" ? (
                    <LanguagesSection formValues={formValues} setFormValues={setFormValues} />
                  ) : activeSection === "social_login" ? (
                    <SocialLoginSection formValues={formValues} setFormValues={setFormValues} />
                  ) : currentFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">No settings available for this section yet.</p>
                  ) : (
                    <div className="space-y-4">
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
                      {activeSection === "mail" && (
                        <SendTestEmailButton />
                      )}
                      {activeSection === "analytics" && (
                        <TestGoogleMapsKeyButton apiKey={formValues.google_maps_api_key || ""} />
                      )}
                      {activeSection === "about" && (
                        <div className="mt-8 pt-6 border-t border-border">
                          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> FAQ Section
                          </h3>
                          <DynamicFAQSection formValues={formValues} setFormValues={setFormValues} />
                        </div>
                      )}
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
