import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border pb-20 md:pb-0">
      <div className="section-container py-10 md:py-14">
        {/* Brand */}
        <div className="mb-8">
          <h3 className="text-2xl font-display font-bold mb-2">
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
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Social link"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-display font-semibold text-base mb-3 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["About Us", "Contact Us", "Privacy Policy", "Terms & Conditions"].map((link) => (
                <li key={link}>
                  <Link to="#" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-base mb-3 text-foreground">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Flowers", "Cakes", "Plants", "Gift Hampers"].map((link) => (
                <li key={link}>
                  <Link to="/shop" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-8">
          <h4 className="font-display font-semibold text-base mb-3 text-foreground">Contact Us</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">📞 +880 1XXX-XXXXXX</li>
            <li className="flex items-center gap-2">📧 hello@pikoolyflora.com</li>
          </ul>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-5">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} PikoolyFlora. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
