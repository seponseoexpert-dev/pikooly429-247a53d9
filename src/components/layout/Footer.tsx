import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border pb-20 md:pb-0">
      <div className="section-container py-8 sm:py-10 md:py-12 lg:py-14">
        {/* Desktop: 4-col layout / Mobile: stacked */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-display font-bold mb-2">
              <span className="text-foreground">Pikooly</span>
              <span className="text-primary">Flora</span>
            </h3>
            <p className="text-sm text-muted-foreground italic">
              "Not just a Gift,<br />
              It's sharing of Love."
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                  aria-label="Social link"
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-sm sm:text-base mb-3 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {["About Us", "Contact Us", "Privacy Policy", "Terms & Conditions"].map((link) => (
                <li key={link}>
                  <Link to="#" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-semibold text-sm sm:text-base mb-3 text-foreground">Categories</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {["Flowers", "Cakes", "Plants", "Gift Hampers"].map((link) => (
                <li key={link}>
                  <Link to="/shop" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm sm:text-base mb-3 text-foreground">Contact Us</h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">📞 +880 1XXX-XXXXXX</li>
              <li className="flex items-center gap-2">📧 hello@pikoolyflora.com</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-5">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} PikoolyFlora. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
