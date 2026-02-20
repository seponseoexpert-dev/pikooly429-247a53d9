import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { settings } = useSiteSettings();

  const phone = settings.store_phone || "+880 1XXX-XXXXXX";
  const email = settings.store_email || "hello@pikoolyflora.com";
  const address = settings.store_address || "";
  const copyright = settings.site_copyright || `© ${new Date().getFullYear()} PikoolyFlora. All Rights Reserved.`;
  const footerText = settings.site_footer_text || "";

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
    { label: "About Us", url: "#" },
    { label: "Contact Us", url: "#" },
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

  return (
    <footer className="bg-secondary/50 border-t border-border pb-20 md:pb-0">
      <div className="section-container py-5 sm:py-8 md:py-10 lg:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10 mb-5 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-display font-bold mb-1">
              <span className="text-foreground">Pikooly</span>
              <span className="text-primary">Flora</span>
            </h3>
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
              <li className="flex items-center gap-2">📧 {email}</li>
              {address && <li className="flex items-center gap-2">📍 {address}</li>}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-3 sm:pt-5">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
