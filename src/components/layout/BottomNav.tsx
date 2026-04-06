import { Link, useLocation } from "react-router-dom";
import { Home, Gift, User, Flower2, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  const iconSize = 21;
  const strokeW = 1.5;
  const activeStrokeW = 1.9;

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-[2px] transition-all duration-200 active:scale-90 min-w-[44px] min-h-[50px] ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  const labelClass = (active: boolean) =>
    `text-[10px] leading-none tracking-wide ${active ? "font-semibold" : "font-medium"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative border-t border-border/50 bg-background shadow-sm">
        <div className="grid grid-cols-5 h-[64px]">
          <Link to="/" className={itemClass(isActive("/"))}>
            <Home size={iconSize} strokeWidth={isActive("/") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/"))}>{t("home")}</span>
          </Link>

          <Link to="/shop?same_day=true" className={itemClass(isActive("/shop"))}>
            <Zap size={iconSize} strokeWidth={isActive("/shop") ? activeStrokeW : strokeW} />
            <span className={labelClass(isActive("/shop"))}>Same Day</span>
          </Link>

          <div className="relative flex flex-col items-center justify-end pb-1">
            <Link
              to="/custom-bouquet"
              className={`absolute -top-3 flex items-center justify-center w-[46px] h-[46px] rounded-full shadow-lg transition-all duration-300 active:scale-90 ${
                isActive("/custom-bouquet")
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/90 text-primary-foreground hover:bg-primary"
              }`}
            >
              <Flower2 size={20} strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-full border-[3px] border-background" />
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
