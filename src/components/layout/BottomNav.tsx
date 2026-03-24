import { Link, useLocation } from "react-router-dom";
import { Home, Truck, Gift, User, Flower2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname + location.search === href);

  const iconSize = 22;
  const strokeW = 1.5;
  const activeStrokeW = 1.8;

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-[3px] transition-all duration-200 active:scale-90 ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  const labelClass = (active: boolean) =>
    `text-[10px] leading-none tracking-wide ${active ? "font-semibold" : "font-medium"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="relative bg-card/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-[64px]">
          {/* Home */}
          <Link to="/" className={itemClass(isActive("/"))}>
            <Home size={iconSize} strokeWidth={isActive("/") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/"))}>{t("home")}</span>
          </Link>

          {/* Same Day */}
          <Link to="/product-category/same-day" className={itemClass(isActive("/product-category/same-day"))}>
            <Truck size={iconSize} strokeWidth={isActive("/product-category/same-day") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/product-category/same-day"))}>{t("same_day")}</span>
          </Link>

          {/* Bouquet - elevated center */}
          <div className="flex flex-col items-center justify-end pb-[7px] relative">
            <Link
              to="/custom-bouquet"
              className={`absolute -top-5 flex items-center justify-center w-[50px] h-[50px] rounded-full shadow-lg transition-all duration-300 active:scale-90 ${
                isActive("/custom-bouquet")
                  ? "bg-primary text-primary-foreground shadow-primary/30"
                  : "bg-primary/90 text-primary-foreground shadow-primary/20 hover:bg-primary"
              }`}
            >
              <Flower2 size={24} strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-full border-[3px] border-card" />
            </Link>
            <span className={labelClass(isActive("/custom-bouquet"))}>
              Bouquet
            </span>
          </div>

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className={itemClass(false)}
          >
            <div className="relative">
              <ShoppingBag size={iconSize} strokeWidth={strokeW} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold animate-scale-in">
                  {totalItems}
                </span>
              )}
            </div>
            <span className={labelClass(false)}>{t("cart")}</span>
          </button>

          {/* Account */}
          <Link to="/account" className={itemClass(isActive("/account"))}>
            <User size={iconSize} strokeWidth={isActive("/account") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/account"))}>{t("account")}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
