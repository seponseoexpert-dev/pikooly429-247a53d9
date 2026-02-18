import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="section-container py-12 md:py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-display font-bold mb-3">🌸 Pikooly</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              Not just a Gift. It's sharing of Love. Order fresh flowers, cakes & gifts online in Bangladesh.
            </p>
            <div className="flex gap-3 mt-4">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: MessageCircle, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label="Social link"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {["About Us", "Contact", "Blog", "FAQ", "Track Order"].map((link) => (
                <li key={link}>
                  <Link to="#" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {["Flowers", "Cakes", "Gift Combos", "Perfumes", "Birthday"].map((link) => (
                <li key={link}>
                  <Link to="/shop" className="hover:text-primary transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>📍 Dhaka, Bangladesh</li>
              <li>📞 +880 1XXX-XXXXXX</li>
              <li>📧 hello@pikooly.com</li>
              <li className="pt-2 text-xs text-background/50">Delivery: 9AM — 10PM daily</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50">
            © {new Date().getFullYear()} Pikooly. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-background/50">
            <span>bKash</span>
            <span>Nagad</span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;