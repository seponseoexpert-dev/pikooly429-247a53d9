import { Link, useLocation } from "react-router-dom";
import { Home, Truck, ShoppingBag, User, Flower2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();
  const { t } = useLanguage();

  const sideLinks = [
    { icon: Home, label: t("home"), href: "/", isCart: false },
    { icon: Truck, label: t("same_day"), href: "/product-category/same-day", isCart: false },
    // center placeholder
    { icon: ShoppingBag, label: t("cart"), href: "#cart", isCart: true },
    { icon: User, label: t("account"), href: "/account", isCart: false },
  ];

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname + location.search === href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Background with glass effect */}
      <div className="relative bg-card/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-end justify-around h-[68px] px-1">
          {/* Home */}
          <NavItem icon={Home} label={t("home")} href="/" active={isActive("/")} />

          {/* Same Day */}
          <NavItem icon={Truck} label={t("same_day")} href="/product-category/same-day" active={isActive("/product-category/same-day")} />

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground relative active:scale-90 transition-all duration-200 pb-2"
          >
            <div className="relative">
              <ShoppingBag size={22} strokeWidth={1.6} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold animate-scale-in">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{t("cart")}</span>
          </button>

          {/* Account */}
          <NavItem icon={User} label={t("account")} href="/account" active={isActive("/account")} />
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  active: boolean;
}) => (
  <Link
    to={href}
    className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-90 pb-2 ${
      active ? "text-primary" : "text-muted-foreground"
    }`}
  >
    <div className="relative">
      <Icon
        size={22}
        strokeWidth={active ? 2 : 1.6}
        className={`transition-transform duration-200 ${active ? "scale-105" : ""}`}
      />
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
    </div>
    <span className={`text-[10px] leading-none transition-all duration-200 ${active ? "font-semibold" : "font-medium"}`}>
      {label}
    </span>
  </Link>
);

export default BottomNav;
