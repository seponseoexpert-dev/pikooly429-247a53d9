import { Link, useLocation } from "react-router-dom";
import { Home, Truck, Gift, User, Flower2, CalendarHeart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  const iconSize = 19;
  const iconSize = 20;
  const strokeW = 1.5;
  const activeStrokeW = 1.8;

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-[3px] transition-all duration-200 active:scale-90 min-w-[44px] min-h-[44px] ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  const labelClass = (active: boolean) =>
    `text-[9px] leading-none tracking-wide ${active ? "font-semibold" : "font-medium"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative safe-area-bottom bg-card/98 backdrop-blur-xl border-t border-border/50">
        <div className="grid grid-cols-5 h-[58px]">
          <Link to="/" className={itemClass(isActive("/"))}>
            <Home size={iconSize} strokeWidth={isActive("/") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/"))}>{t("home")}</span>
          </Link>

          <Link to="/product-category/same-day" className={itemClass(isActive("/product-category/same-day"))}>
            <Truck size={iconSize} strokeWidth={isActive("/product-category/same-day") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/product-category/same-day"))}>{t("same_day")}</span>
          </Link>

          <div className="flex flex-col items-center justify-end pb-[6px] relative">
            <Link
              to="/custom-bouquet"
              className={`absolute -top-3.5 flex items-center justify-center w-[44px] h-[44px] rounded-full shadow-lg transition-all duration-300 active:scale-90 ${
                isActive("/custom-bouquet")
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/90 text-primary-foreground hover:bg-primary"
              }`}
            >
              <Flower2 size={20} strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-full border-[3px] border-card" />
            </Link>
            <span className={labelClass(isActive("/custom-bouquet"))}>
              Custom
            </span>
          </div>

          <Link to="/all-gifts" className={itemClass(isActive("/all-gifts"))}>
            <Gift size={iconSize} strokeWidth={isActive("/all-gifts") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/all-gifts"))}>All Gifts</span>
          </Link>

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
