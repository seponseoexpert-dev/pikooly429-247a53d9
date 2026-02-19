import { Link, useLocation } from "react-router-dom";
import { Home, Truck, Gift, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();

  const links = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Truck, label: "Same Day", href: "/shop?cat=same-day" },
    { icon: Gift, label: "All Gifts", href: "/shop" },
    { icon: ShoppingCart, label: "Cart", href: "#cart", isCart: true },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {links.map(({ icon: Icon, label, href, isCart }) => {
          const isActive = !isCart && (location.pathname === href || (href !== "/" && location.pathname + location.search === href));
          
          if (isCart) {
            return (
              <button
                key={label}
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors text-muted-foreground relative"
              >
                <Icon size={20} strokeWidth={1.8} />
                {totalItems > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-1.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          }

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
