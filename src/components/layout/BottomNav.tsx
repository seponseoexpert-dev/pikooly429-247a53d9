import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Grid3X3, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();

  const links = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Grid3X3, label: "Shop", href: "/shop" },
    { icon: Search, label: "Search", href: "/shop?search=true" },
    { icon: ShoppingBag, label: "Cart", href: "#cart", onClick: () => setIsOpen(true) },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {links.map(({ icon: Icon, label, href, onClick }) => {
          const isActive = location.pathname === href;
          if (onClick) {
            return (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative"
              >
                <Icon size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }
          return (
            <Link
              key={label}
              to={href}
              className={`flex flex-col items-center gap-0.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;