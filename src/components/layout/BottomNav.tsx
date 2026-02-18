import { Link, useLocation } from "react-router-dom";
import { Home, Zap, Gift, Globe, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const links = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Zap, label: "Same Day", href: "/shop?cat=same-day" },
    { icon: Gift, label: "All Gifts", href: "/shop" },
    { icon: Globe, label: "Abroad", href: "/shop?cat=premium" },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {links.map(({ icon: Icon, label, href }) => {
          const isActive = location.pathname === href || (href !== "/" && location.pathname + location.search === href);
          return (
            <Link
              key={label}
              to={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;