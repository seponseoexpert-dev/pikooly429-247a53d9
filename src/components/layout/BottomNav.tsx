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
    `group relative flex flex-col items-center justify-center gap-[2px] transition-all duration-300 ease-out active:scale-90 min-w-[44px] min-h-[50px] ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  const iconWrapClass = (active: boolean) =>
    `relative flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      active ? "-translate-y-0.5 scale-110" : "scale-100 group-active:scale-95"
    }`;

  const labelClass = (active: boolean) =>
    `text-[10px] leading-none tracking-wide transition-all duration-300 ${
      active ? "font-semibold opacity-100" : "font-medium opacity-80"
    }`;

  const ActiveDot = ({ active }: { active: boolean }) => (
    <span
      className={`absolute -bottom-1 h-[3px] rounded-full bg-primary transition-all duration-300 ease-out ${
        active ? "w-4 opacity-100" : "w-0 opacity-0"
      }`}
    />
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative border-t border-border/50 bg-background/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 h-[64px]">
          <Link to="/" className={itemClass(isActive("/"))}>
            <span className={iconWrapClass(isActive("/"))}>
              <Home size={iconSize} strokeWidth={isActive("/") ? activeStrokeW : strokeW} />
            </span>
            <span className={labelClass(isActive("/"))}>{t("home")}</span>
            <ActiveDot active={isActive("/")} />
          </Link>

          <Link to="/shop?same_day=true" className={itemClass(isActive("/shop"))}>
            <span className={iconWrapClass(isActive("/shop"))}>
              <Zap size={iconSize} strokeWidth={isActive("/shop") ? activeStrokeW : strokeW} />
            </span>
            <span className={labelClass(isActive("/shop"))}>Same Day</span>
            <ActiveDot active={isActive("/shop")} />
          </Link>

          <div className="relative flex flex-col items-center justify-end pb-1">
            {/* Soft pulsing halo */}
            <span
              aria-hidden
              className="absolute -top-3 w-[46px] h-[46px] rounded-full bg-primary/30 animate-ping opacity-60 pointer-events-none"
              style={{ animationDuration: "2.4s" }}
            />
            <Link
              to="/custom-bouquet"
              className={`absolute -top-3 flex items-center justify-center w-[46px] h-[46px] rounded-full shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 hover:scale-105 ${
                isActive("/custom-bouquet")
                  ? "bg-primary text-primary-foreground -translate-y-0.5 shadow-primary/40 shadow-xl"
                  : "bg-primary/90 text-primary-foreground hover:bg-primary"
              }`}
            >
              <Flower2
                size={20}
                strokeWidth={1.8}
                className={`transition-transform duration-500 ease-out ${
                  isActive("/custom-bouquet") ? "rotate-[360deg]" : "group-hover:rotate-12"
                }`}
              />
              <span className="absolute inset-0 rounded-full border-[3px] border-background" />
            </Link>
            <span className={labelClass(isActive("/custom-bouquet"))}>
              Custom
            </span>
          </div>

          <Link to="/all-gifts" className={itemClass(isActive("/all-gifts"))}>
            <span className={iconWrapClass(isActive("/all-gifts"))}>
              <Gift size={iconSize} strokeWidth={isActive("/all-gifts") ? activeStrokeW : strokeW} />
            </span>
            <span className={labelClass(isActive("/all-gifts"))}>All Gifts</span>
            <ActiveDot active={isActive("/all-gifts")} />
          </Link>

          <Link to="/account" className={itemClass(isActive("/account"))}>
            <span className={iconWrapClass(isActive("/account"))}>
              <User size={iconSize} strokeWidth={isActive("/account") ? activeStrokeW : strokeW} />
            </span>
            <span className={labelClass(isActive("/account"))}>{t("account")}</span>
            <ActiveDot active={isActive("/account")} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
