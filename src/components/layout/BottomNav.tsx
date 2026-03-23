import { Link, useLocation } from "react-router-dom";
import { Home, Truck, ShoppingBag, User, Flower2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();
  const { t } = useLanguage();

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname + location.search === href);

  const iconSize = 24;
  const strokeW = 1.5;
  const activeStrokeW = 1.8;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="relative bg-card/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-[64px]">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home size={iconSize} strokeWidth={isActive("/") ? activeStrokeW : strokeW} />
            <span className={`text-[10px] leading-none ${isActive("/") ? "font-semibold" : "font-medium"}`}>
              {t("home")}
            </span>
          </Link>

          {/* Same Day */}
          <Link
            to="/product-category/same-day"
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
              isActive("/product-category/same-day") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Truck size={iconSize} strokeWidth={isActive("/product-category/same-day") ? activeStrokeW : strokeW} />
            <span className={`text-[10px] leading-none ${isActive("/product-category/same-day") ? "font-semibold" : "font-medium"}`}>
              {t("same_day")}
            </span>
          </Link>

          {/* Bouquet - elevated center */}
          <div className="flex flex-col items-center justify-end pb-1.5 relative">
            <Link
              to="/custom-bouquet"
              className={`absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-full shadow-lg transition-all duration-300 active:scale-90 ${
                isActive("/custom-bouquet")
                  ? "bg-primary text-primary-foreground shadow-primary/30"
                  : "bg-primary/90 text-primary-foreground shadow-primary/20 hover:bg-primary"
              }`}
            >
              <Flower2 size={26} strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-full border-[3px] border-card" />
            </Link>
            <span className={`text-[10px] leading-none ${isActive("/custom-bouquet") ? "font-semibold text-primary" : "font-medium text-muted-foreground"}`}>
              Bouquet
            </span>
          </div>

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 text-muted-foreground`}
          >
            <div className="relative">
              <ShoppingBag size={iconSize} strokeWidth={strokeW} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold animate-scale-in">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{t("cart")}</span>
          </button>

          {/* Account */}
          <Link
            to="/account"
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
              isActive("/account") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User size={iconSize} strokeWidth={isActive("/account") ? activeStrokeW : strokeW} />
            <span className={`text-[10px] leading-none ${isActive("/account") ? "font-semibold" : "font-medium"}`}>
              {t("account")}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
