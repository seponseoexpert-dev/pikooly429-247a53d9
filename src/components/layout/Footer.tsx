import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Send, Phone, Mail, MapPin, Heart, ArrowRight } from "lucide-react";
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

  const paymentMethods = [
    { key: "footer_payment_visa", label: "Visa", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Visa"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">VISA</text></svg>
    )},
    { key: "footer_payment_mastercard", label: "Mastercard", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Mastercard"><rect width="48" height="32" rx="4" fill="#2D2D2D"/><circle cx="19" cy="16" r="9" fill="#EB001B" opacity="0.9"/><circle cx="29" cy="16" r="9" fill="#F79E1B" opacity="0.9"/><path d="M24 9.5a9 9 0 010 13 9 9 0 010-13z" fill="#FF5F00"/></svg>
    )},
    { key: "footer_payment_amex", label: "Amex", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Amex"><rect width="48" height="32" rx="4" fill="#2E77BC"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AMEX</text></svg>
    )},
    { key: "footer_payment_paypal", label: "PayPal", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="PayPal"><rect width="48" height="32" rx="4" fill="#FFF" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="20" textAnchor="middle" fill="#003087" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PayPal</text></svg>
    )},
    { key: "footer_payment_stripe", label: "Stripe", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Stripe"><rect width="48" height="32" rx="4" fill="#635BFF"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Stripe</text></svg>
    )},
    { key: "footer_payment_bkash", label: "bKash", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="bKash"><rect width="48" height="32" rx="4" fill="#E2136E"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">bKash</text></svg>
    )},
    { key: "footer_payment_nagad", label: "Nagad", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Nagad"><rect width="48" height="32" rx="4" fill="#F6921E"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Nagad</text></svg>
    )},
    { key: "footer_payment_cod", label: "Cash on Delivery", svg: (
      <svg viewBox="0 0 48 32" width={40} height={28} role="img" aria-label="Cash on Delivery"><rect width="48" height="32" rx="4" fill="#4CAF50"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">COD</text></svg>
    )},
  ];

  const activePaymentMethods = paymentMethods.filter((m) => settings[m.key] === "true");

  const defaultSocials = [
    { icon: Facebook, label: "Facebook" },
    { icon: Instagram, label: "Instagram" },
    { icon: Twitter, label: "Twitter" },
    { icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="relative pb-[72px] md:pb-0 overflow-hidden" style={{ contain: "layout style" }}>
      {/* Newsletter CTA Band */}
      <div className="bg-primary">
        <div className="section-container py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-display font-bold text-primary-foreground dark:text-primary-foreground">
                {t("subscribe_title")}
              </h3>
              <p className="text-xs sm:text-sm text-primary-foreground/70 mt-0.5">
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
                className="flex-1 sm:w-56 h-11 rounded-l-lg border-0 bg-primary-foreground/15 backdrop-blur-sm px-4 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-5 rounded-r-lg bg-primary-foreground text-primary text-sm font-semibold hover:bg-primary-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} />
                <span className="hidden sm:inline">{t("subscribe")}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[hsl(30,15%,12%)]">
        <div className="section-container py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 xl:gap-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              {(settings.footer_logo || settings.company_logo) ? (
                <img
                  src={settings.footer_logo || settings.company_logo}
                  alt={settings.store_name || "Store Logo"}
                  width={120}
                  height={48}
                  className="h-10 sm:h-12 w-auto mb-3 object-contain brightness-0 invert"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <h3 className="text-xl sm:text-2xl font-display font-bold mb-3 text-white">
                  {storeName}
                </h3>
              )}
              {footerText ? (
                <p className="text-xs sm:text-sm text-white/50 italic leading-relaxed">
                  {footerText}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-white/50 italic leading-relaxed">
                  "Not just a Gift,<br />It's sharing of Love."
                </p>
              )}
              <div className="flex gap-2 mt-4">
                {(socialLinks.length > 0 ? socialLinks : defaultSocials).map(({ icon: Icon, label }, i) => (
                  <a
                    key={i}
                    href={socialLinks.length > 0 ? (socialLinks[i] as any)?.url || "#" : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    aria-label={label}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                {t("quick_links")}
              </h4>
              <ul className="space-y-2.5">
                {finalQuickLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.url || "#"}
                      className="group flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                {t("categories")}
              </h4>
              <ul className="space-y-2.5">
                {finalCategoryLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.url || "/shop"}
                      className="group flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                {t("contact_us")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href={`tel:${phone}`} className="flex items-start gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                    <Phone size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${storeEmail}`} className="flex items-start gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                    <Mail size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{storeEmail}</span>
                  </a>
                </li>
                {address && (
                  <li className="flex items-start gap-2.5 text-sm text-white/60">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="section-container py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {activePaymentMethods.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activePaymentMethods.map((m) => (
                    <div
                      key={m.key}
                      title={m.label}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {m.svg}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-white/40 flex items-center gap-1">
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
