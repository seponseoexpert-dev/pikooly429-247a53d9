import { memo, useState } from "react";
import paymentMethodsImg from "@/assets/payment-methods.webp";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Send, Phone, Mail, MapPin, Heart } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = memo(() => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storeName = settings.store_name || "Pikooly";
  const phone = settings.store_phone || "+880 1XXX-XXXXXX";
  const storeEmail = settings.store_email || "hello@pikoolyflora.com";
  const address = settings.store_address || "";
  const copyright = settings.site_copyright || `© ${new Date().getFullYear()} ${storeName}. All Rights Reserved.`;
  const footerText = settings.site_footer_text || "";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed!");
        setEmail("");
      }
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: Facebook, url: settings.facebook_url, label: "Facebook" },
    { icon: Instagram, url: settings.instagram_url, label: "Instagram" },
    { icon: Twitter, url: settings.twitter_url, label: "Twitter" },
    { icon: Youtube, url: settings.youtube_url, label: "YouTube" },
  ].filter((s) => s.url);

  const quickLinks = [1, 2, 3, 4]
    .map((i) => ({
      label: settings[`footer_quick_link_${i}_label`],
      url: settings[`footer_quick_link_${i}_url`],
    }))
    .filter((l) => l.label);

  const defaultQuickLinks = [
    { label: "About Us", url: "/about-us" },
    { label: "Contact Us", url: "/contact-us" },
    { label: "Privacy Policy", url: "#" },
    { label: "Terms & Conditions", url: "#" },
  ];

  const finalQuickLinks = quickLinks.length > 0 ? quickLinks : defaultQuickLinks;

  const categoryLinks = [1, 2, 3, 4]
    .map((i) => ({
      label: settings[`footer_category_${i}_label`],
      url: settings[`footer_category_${i}_url`],
    }))
    .filter((l) => l.label);

  const defaultCategoryLinks = [
    { label: "Flowers", url: "/shop" },
    { label: "Cakes", url: "/shop" },
    { label: "Plants", url: "/shop" },
    { label: "Gift Hampers", url: "/shop" },
  ];

  const finalCategoryLinks = categoryLinks.length > 0 ? categoryLinks : defaultCategoryLinks;

  const paymentMethodKeys = [
    "footer_payment_visa",
    "footer_payment_mastercard",
    "footer_payment_amex",
    "footer_payment_paypal",
    "footer_payment_stripe",
    "footer_payment_bkash",
    "footer_payment_nagad",
    "footer_payment_cod",
  ];

  const showPaymentStrip = paymentMethodKeys.some((key) => settings[key] === "true");

  const defaultSocials = [
    { icon: Facebook, label: "Facebook" },
    { icon: Instagram, label: "Instagram" },
    { icon: Twitter, label: "Twitter" },
    { icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="relative pb-[72px] md:pb-0 overflow-hidden" style={{ contain: "layout style" }}>
      {/* Newsletter */}
      <div className="bg-foreground">
        <div className="section-container py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-display font-semibold text-background">
                {t("subscribe_title")}
              </h3>
              <p className="text-xs sm:text-sm text-background/50 mt-1">
                {t("subscribe_subtitle")}
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enter_email")}
                required
                className="flex-1 sm:w-56 h-11 rounded-l-lg border-0 bg-background/10 px-4 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-background/20"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-5 rounded-r-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} />
                <span className="hidden sm:inline">{t("subscribe")}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-foreground/95">
        <div className="section-container py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              {(settings.footer_logo || settings.company_logo) ? (
                <img
                  src={settings.footer_logo || settings.company_logo}
                  alt={settings.store_name || "Store Logo"}
                  width={120}
                  height={48}
                  className="h-9 sm:h-10 w-auto mb-4 object-contain brightness-0 invert"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <h3 className="text-xl font-display font-semibold mb-4 text-background">
                  {storeName}
                </h3>
              )}
              <p className="text-xs sm:text-sm text-background/40 leading-relaxed">
                {footerText || '"Not just a Gift, It\'s sharing of Love."'}
              </p>
              <div className="flex gap-2.5 mt-5">
                {(socialLinks.length > 0 ? socialLinks : defaultSocials).map(({ icon: Icon, label }, i) => (
                  <a
                    key={i}
                    href={socialLinks.length > 0 ? (socialLinks[i] as any)?.url || "#" : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-background/8 flex items-center justify-center text-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    aria-label={label}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/30 mb-4">
                {t("quick_links")}
              </h4>
              <ul className="space-y-2.5">
                {finalQuickLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.url || "#"}
                      className="text-sm text-background/50 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/30 mb-4">
                {t("categories")}
              </h4>
              <ul className="space-y-2.5">
                {finalCategoryLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.url || "/shop"}
                      className="text-sm text-background/50 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/30 mb-4">
                {t("contact_us")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href={`tel:${phone}`} className="flex items-start gap-2.5 text-sm text-background/50 hover:text-background transition-colors">
                    <Phone size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${storeEmail}`} className="flex items-start gap-2.5 text-sm text-background/50 hover:text-background transition-colors">
                    <Mail size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{storeEmail}</span>
                  </a>
                </li>
                {address && (
                  <li className="flex items-start gap-2.5 text-sm text-background/50">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/8">
          <div className="section-container py-4">
            <div className="flex flex-col items-center gap-2.5">
              {showPaymentStrip && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-background/40 italic whitespace-nowrap">Pay with</span>
                  <img
                    src={paymentMethodsImg}
                    alt="Accepted payment methods"
                    className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="flex items-center gap-1 text-[10px] text-background/30 sm:text-xs">
                {copyright} — Made with <Heart size={10} className="text-destructive inline" /> in Bangladesh
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
