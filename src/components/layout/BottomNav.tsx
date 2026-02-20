import { Link, useLocation } from "react-router-dom";
import { Home, Truck, Gift, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();

  const links = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Truck, label: "Same Day", href: "/shop?cat=same-day" },
    { icon: Gift, label: "All Gifts", href: "/all-gifts" },
    { icon: ShoppingCart, label: "Cart", href: "#cart", isCart: true },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16">
        {links.map(({ icon: Icon, label, href, isCart }) => {
          const isActive = !isCart && (location.pathname === href || (href !== "/" && location.pathname + location.search === href));
          
          if (isCart) {
            return (
              <button
                key={label}
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground relative active:scale-90 transition-transform duration-200"
              >
                <Icon size={24} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute top-2 left-1/2 ml-2 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-scale-in">
                    {totalItems}
                  </span>
                )}
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              to={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full active:scale-90 transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.2 : 1.5} className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[11px] font-medium leading-none transition-all duration-200 ${isActive ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
