import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Footer = memo(() => {
  const { settings } = useSiteSettings();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const phone = settings.store_phone || "+880 1XXX-XXXXXX";
  const storeEmail = settings.store_email || "hello@pikoolyflora.com";
  const address = settings.store_address || "";
  const copyright = settings.site_copyright || `© ${new Date().getFullYear()} PikoolyFlora. All Rights Reserved.`;
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
    { icon: Facebook, url: settings.facebook_url },
    { icon: Instagram, url: settings.instagram_url },
    { icon: Twitter, url: settings.twitter_url },
    { icon: Youtube, url: settings.youtube_url },
  ].filter((s) => s.url);

  // Dynamic quick links from admin settings
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

  // Dynamic category links from admin settings
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

  // Payment method icons from admin settings
  const paymentMethods = [
    { key: "footer_payment_visa", label: "Visa", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">VISA</text></svg>
    )},
    { key: "footer_payment_mastercard", label: "Mastercard", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#2D2D2D"/><circle cx="19" cy="16" r="9" fill="#EB001B" opacity="0.9"/><circle cx="29" cy="16" r="9" fill="#F79E1B" opacity="0.9"/><path d="M24 9.5a9 9 0 010 13 9 9 0 010-13z" fill="#FF5F00"/></svg>
    )},
    { key: "footer_payment_amex", label: "Amex", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#2E77BC"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AMEX</text></svg>
    )},
    { key: "footer_payment_paypal", label: "PayPal", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#FFF" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="20" textAnchor="middle" fill="#003087" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PayPal</text></svg>
    )},
    { key: "footer_payment_stripe", label: "Stripe", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#635BFF"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Stripe</text></svg>
    )},
    { key: "footer_payment_bkash", label: "bKash", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#E2136E"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">bKash</text></svg>
    )},
    { key: "footer_payment_nagad", label: "Nagad", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#F6921E"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Nagad</text></svg>
    )},
    { key: "footer_payment_cod", label: "Cash on Delivery", svg: (
      <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#4CAF50"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">COD</text></svg>
    )},
  ];

  const activePaymentMethods = paymentMethods.filter((m) => settings[m.key] === "true");

  return (
    <footer className="bg-secondary/50 border-t border-border pb-20 md:pb-0">
      <div className="section-container py-5 sm:py-8 md:py-10 lg:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10 mb-5 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            {settings.footer_logo ? (
              <img src={settings.footer_logo} alt="Footer Logo" className="h-10 sm:h-12 w-auto mb-1 object-contain" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-display font-bold mb-1">
                <span className="text-foreground">Pikooly</span>
                <span className="text-primary">Flora</span>
              </h3>
            )}
            {footerText && (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                {footerText}
              </p>
            )}
            {!footerText && (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                "Not just a Gift,<br />
                It's sharing of Love."
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex gap-2.5 mt-3">
                {socialLinks.map(({ icon: Icon, url }, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                    aria-label="Social link"
                  >
                    <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
                  </a>
                ))}
              </div>
            )}
            {socialLinks.length === 0 && (
              <div className="flex gap-2.5 mt-3">
                {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                    aria-label="Social link"
                  >
                    <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-xs sm:text-base mb-2 sm:mb-3 text-foreground">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm text-muted-foreground">
              {finalQuickLinks.map((link, i) => (
                <li key={i}>
                  <Link to={link.url || "#"} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-semibold text-xs sm:text-base mb-2 sm:mb-3 text-foreground">Categories</h4>
            <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm text-muted-foreground">
              {finalCategoryLinks.map((link, i) => (
                <li key={i}>
                  <Link to={link.url || "/shop"} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display font-semibold text-xs sm:text-base mb-2 sm:mb-3 text-foreground">Contact Us</h4>
             <ul className="space-y-1 text-[11px] sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">📞 {phone}</li>
              <li className="flex items-center gap-2">📧 {storeEmail}</li>
              {address && <li className="flex items-center gap-2">📍 {address}</li>}
            </ul>
            {/* Newsletter */}
            <div className="mt-3">
              <p className="text-[11px] sm:text-xs font-semibold text-foreground mb-1.5">Subscribe to Newsletter</p>
              <form onSubmit={handleSubscribe} className="flex gap-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="flex-1 min-w-0 h-8 sm:h-9 rounded-md border border-input bg-background px-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-8 sm:h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Payment Methods & Copyright */}
        <div className="border-t border-border pt-3 sm:pt-5 space-y-3">
          {activePaymentMethods.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activePaymentMethods.map((m) => (
                <div key={m.key} title={m.label} className="opacity-80 hover:opacity-100 transition-opacity">
                  {m.svg}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
