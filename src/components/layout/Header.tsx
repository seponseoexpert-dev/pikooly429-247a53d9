import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, X, User, Truck, ChevronDown, MapPinCheck, Moon, Sun, Globe, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "next-themes";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const normalizeSearchText = (value: string | null | undefined) =>
  (value || "")
    .replace(/&amp;|&#38;|&#038;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff&\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesProductSearch = (product: any, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchParts = [
    product.name,
    product.short_description,
    product.categories?.name,
    product.subcategories?.name,
    ...(Array.isArray(product.tags) ? product.tags : []),
    ...((product.product_categories || []).map((item: any) => item.categories?.name).filter(Boolean)),
    ...((product.product_subcategories || []).map((item: any) => item.subcategories?.name).filter(Boolean)),
  ];

  return normalizeSearchText(searchParts.join(" ")).includes(normalizedQuery);
};

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [pinnedMegaMenu, setPinnedMegaMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const { totalItems, setIsOpen } = useCart();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const { currencies, selectedCurrency, setSelectedCurrency, formatPrice } = useMultiCurrency();
  const { user } = useAuth();
  const { language, setLanguage, t, languages, multiLanguageEnabled } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const headerRootRef = useRef<HTMLDivElement>(null);

  const logoUrl = settings.company_logo || "";
  const announcementText = settings.announcement_bar_text || "🌸 Same Day Delivery Available in 500+ Cities";
  const showAnnouncement = !settingsLoading && settings.announcement_bar_enabled !== "false";

  const { data: allProducts = [] } = useQuery({
    queryKey: ["header-search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, image_url, short_description, tags, categories(name), subcategories(name), product_categories(category_id, categories(name)), product_subcategories(subcategory_id, subcategories(name))")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .eq("show_in_header", true)
        .neq("category_type", "tailored")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["header-subcategories-with-count"],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("subcategories")
        .select("id, name, slug, category_id, image_url")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      const { data: counts } = await supabase
        .from("product_subcategories")
        .select("subcategory_id");
      const countMap: Record<string, number> = {};
      (counts || []).forEach((c) => {
        countMap[c.subcategory_id] = (countMap[c.subcategory_id] || 0) + 1;
      });
      return (subs || []).map((s) => ({ ...s, product_count: countMap[s.id] || 0 }));
    },
  });

  const subsByCategory = useMemo(() => {
    const map: Record<string, typeof subcategories> = {};
    subcategories.forEach((s) => {
      if (!map[s.category_id]) map[s.category_id] = [];
      map[s.category_id].push(s);
    });
    return map;
  }, [subcategories]);

  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [canUseHover, setCanUseHover] = useState(false);
  const megaMenuCloseTimer = useRef<number | null>(null);

  const suggestions = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    return allProducts.filter((product) => matchesProductSearch(product, searchQuery)).slice(0, 6);
  }, [allProducts, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setShowCurrencyDropdown(false);
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) setShowLanguageDropdown(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredCat(null);
        setPinnedMegaMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => { if (megaMenuCloseTimer.current) window.clearTimeout(megaMenuCloseTimer.current); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanUseHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setHoveredCat(null);
    setPinnedMegaMenu(null);
  }, [location.pathname]);

  // Track scroll position for compact mobile header
  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 60;
      setScrolled(isScrolled);
      if (isScrolled) setMobileSearchExpanded(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = headerRootRef.current;
    if (!root) return;

    const updateHeaderOffset = () => {
      const isMobile = window.innerWidth < 768;
      document.documentElement.style.setProperty(
        "--mobile-header-offset",
        isMobile ? `${root.offsetHeight}px` : "0px"
      );
    };

    updateHeaderOffset();

    const resizeObserver = new ResizeObserver(updateHeaderOffset);
    resizeObserver.observe(root);
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeaderOffset);
    };
  }, [showAnnouncement, multiLanguageEnabled, languages.length, location.pathname, searchQuery, suggestions.length]);

  const openMegaMenu = (id: string) => {
    if (megaMenuCloseTimer.current) { window.clearTimeout(megaMenuCloseTimer.current); megaMenuCloseTimer.current = null; }
    setHoveredCat(id);
  };
  const closeMegaMenu = () => {
    if (pinnedMegaMenu && !canUseHover) return;
    if (megaMenuCloseTimer.current) window.clearTimeout(megaMenuCloseTimer.current);
    megaMenuCloseTimer.current = window.setTimeout(() => { setHoveredCat(null); megaMenuCloseTimer.current = null; }, 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery(""); setShowSuggestions(false); }
  };
  const handleSelect = (slug: string) => { setSearchQuery(""); setShowSuggestions(false); navigate(`/product/${slug}`); };

  // Icon button component for consistency
  const IconBtn = ({ icon: Icon, label, onClick, href, badge, className = "" }: {
    icon: React.ElementType; label?: string; onClick?: () => void; href?: string; badge?: number; className?: string;
  }) => {
    const content = (
      <span className={`relative flex flex-col items-center justify-center gap-0.5 px-1.5 sm:px-2 lg:px-2.5 py-1.5 rounded-xl text-foreground/75 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200 cursor-pointer ${className}`}>
        <Icon size={19} strokeWidth={1.8} />
        {badge != null && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {label && <span className="hidden md:block text-[9px] lg:text-[10px] font-medium leading-none tracking-wide">{label}</span>}
      </span>
    );
    if (href) return <Link to={href} aria-label={label || ""}>{content}</Link>;
    return <button type="button" onClick={onClick} aria-label={label || ""}>{content}</button>;
  };

  return (
    <div ref={headerRootRef} className="fixed inset-x-0 top-0 z-[60] safe-area-top md:sticky md:top-0">
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-primary text-primary-foreground text-center text-[10px] sm:text-[11px] md:text-xs py-1.5 sm:py-2 px-4 font-semibold tracking-wide">
          {announcementText}
        </div>
      )}

      <header className="bg-card/95 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]">
        <div className="section-container">
          {/* === TOP ROW: Logo + Search + Actions === */}
          <div className="flex items-center h-[52px] sm:h-14 md:h-[60px] lg:h-16 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center">
              {settingsLoading ? (
                <div className="h-7 sm:h-8 md:h-9 lg:h-10 w-20 sm:w-24 md:w-28 lg:w-32 bg-muted rounded-lg animate-pulse" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={settings.store_name || "Store"}
                  width={140}
                  height={48}
                  decoding="async"
                  fetchPriority="high"
                  className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto max-w-[100px] sm:max-w-[112px] md:max-w-[128px] lg:max-w-[140px] object-contain"
                />
              ) : (
                <span className="text-lg sm:text-xl md:text-2xl font-display font-bold">
                  <span className="text-foreground">Pikooly</span>
                  <span className="text-primary">Flora</span>
                </span>
              )}
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-md lg:max-w-xl xl:max-w-2xl mx-auto relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={17} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t("search_placeholder")}
                  className="w-full pl-10 pr-10 py-2 lg:py-2.5 rounded-full bg-muted/60 border border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 focus:bg-card outline-none text-sm transition-all placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={15} />
                  </button>
                )}
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-[100] bg-card border border-border/70 rounded-2xl shadow-[0_12px_40px_-8px_hsl(var(--foreground)/0.12)] overflow-hidden">
                  {suggestions.map((p) => (
                    <button key={p.id} onClick={() => handleSelect(p.slug)} className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                      {p.image_url && <img src={p.image_url} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-border/50" loading="lazy" decoding="async" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          {formatPrice(p.price)}
                          {p.original_price && p.original_price > p.price && (
                            <span className="text-muted-foreground line-through ml-1.5">{formatPrice(p.original_price)}</span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-0 sm:gap-0.5 ml-auto">
              {/* Mobile search icon - visible only when scrolled */}
              <button
                type="button"
                onClick={() => { setMobileSearchExpanded(true); setTimeout(() => mobileSearchInputRef.current?.focus(), 50); }}
                className={`md:hidden relative flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl text-foreground/75 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200 ${
                  scrolled && !mobileSearchExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden pointer-events-none"
                }`}
                aria-label="Search"
              >
                <Search size={19} strokeWidth={1.8} />
              </button>

              <IconBtn
                icon={theme === "dark" ? Sun : Moon}
                label={theme === "dark" ? "Light" : "Dark"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              />

              {multiLanguageEnabled && languages.length > 1 && (
                <div className="relative" ref={languageRef}>
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 sm:px-2 lg:px-2.5 py-1.5 rounded-xl text-foreground/75 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200"
                    aria-label="Language"
                  >
                    <Globe size={19} strokeWidth={1.8} />
                    <span className="hidden md:flex items-center text-[9px] lg:text-[10px] font-medium leading-none tracking-wide gap-0.5">
                      {language.code.toUpperCase()} <ChevronDown size={8} />
                    </span>
                  </button>
                  {showLanguageDropdown && (
                    <div className="absolute right-0 top-full mt-2 z-[100] bg-card border border-border/70 rounded-xl shadow-[0_12px_40px_-8px_hsl(var(--foreground)/0.12)] overflow-hidden min-w-[180px] max-h-[320px] overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang); setShowLanguageDropdown(false); }}
                          className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${
                            language.code === lang.code ? "bg-primary/8 text-primary font-semibold" : "text-foreground"
                          }`}
                        >
                          <span className="w-5 text-center font-semibold text-xs">{lang.code.toUpperCase()}</span>
                          <span>{lang.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <span className="hidden md:inline-flex">
                <IconBtn icon={Truck} label={t("same_day")} href="/product-category/same-day" />
              </span>

              <IconBtn icon={MapPinCheck} label={t("track")} href="/track-order" />

              {/* Currency */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 sm:px-2 lg:px-2.5 py-1.5 rounded-xl text-foreground/75 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200"
                  aria-label="Currency"
                >
                  <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-current text-[10px] font-bold">
                    {selectedCurrency?.symbol || "$"}
                  </span>
                  <span className="hidden md:flex items-center text-[9px] lg:text-[10px] font-medium leading-none tracking-wide gap-0.5">
                    {selectedCurrency?.code || "USD"} <ChevronDown size={8} />
                  </span>
                </button>
                {showCurrencyDropdown && currencies.length > 1 && (
                  <div className="absolute right-0 top-full mt-2 z-[100] bg-card border border-border/70 rounded-xl shadow-[0_12px_40px_-8px_hsl(var(--foreground)/0.12)] overflow-hidden min-w-[160px]">
                    {currencies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCurrency(c); setShowCurrencyDropdown(false); }}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${
                          selectedCurrency?.code === c.code ? "bg-primary/8 text-primary font-semibold" : "text-foreground"
                        }`}
                      >
                        <span className="w-5 text-center font-semibold">{c.symbol}</span>
                        <span>{c.code} - {c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <IconBtn icon={ShoppingCart} label={t("cart")} onClick={() => setIsOpen(true)} badge={totalItems} />

              <span className="hidden sm:inline-flex">
                <IconBtn icon={User} label={user ? t("account") : t("sign_in")} href={user ? "/account" : "/auth"} />
              </span>
            </div>
          </div>

          {/* === MOBILE SEARCH === */}
          {/* Full search bar - shown when not scrolled OR when expanded */}
          <div
            className={`md:hidden relative transition-all duration-100 ease-out overflow-hidden ${
              !scrolled || mobileSearchExpanded ? "max-h-[60px] opacity-100 pb-2" : "max-h-0 opacity-0 pb-0"
            }`}
            ref={searchRef}
          >
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={15} />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t("search_placeholder")}
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-muted/60 border border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-[13px] transition-all placeholder:text-muted-foreground/60"
              />
              {(searchQuery || mobileSearchExpanded) && (
                <button type="button" onClick={() => { setSearchQuery(""); setShowSuggestions(false); if (mobileSearchExpanded) setMobileSearchExpanded(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={15} />
                </button>
              )}
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-card border border-border/70 rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((p) => (
                  <button key={p.id} onClick={() => handleSelect(p.slug)} className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                    {p.image_url && <img src={p.image_url} alt={p.name} width={40} height={40} className="w-9 h-9 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        {formatPrice(p.price)}
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-muted-foreground line-through ml-1.5">{formatPrice(p.original_price)}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* === NAV BAR (Desktop/Tablet) === */}
          <div ref={navRef} className="relative hidden md:block border-t border-border/30">
            <nav className="flex items-center overflow-x-auto scrollbar-hide lg:justify-center">
              {/* Dynamic categories */}
              {categories.map((cat) => {
                const subs = subsByCategory[cat.id] || [];
                const isActive = location.pathname.startsWith(`/product-category/${cat.slug}`);
                const isHovered = hoveredCat === cat.id || pinnedMegaMenu === cat.id;
                return (
                  <div
                    key={cat.id}
                    className="static"
                    onMouseEnter={() => { if (canUseHover && subs.length > 0) openMegaMenu(cat.id); }}
                    onMouseLeave={() => { if (canUseHover && subs.length > 0 && pinnedMegaMenu !== cat.id) closeMegaMenu(); }}
                  >
                    <button
                      type="button"
                      aria-expanded={isHovered}
                      onClick={() => {
                        if (subs.length > 0) {
                          if (canUseHover) {
                            const next = hoveredCat === cat.id ? null : cat.id;
                            if (megaMenuCloseTimer.current) { window.clearTimeout(megaMenuCloseTimer.current); megaMenuCloseTimer.current = null; }
                            setPinnedMegaMenu(null);
                            setHoveredCat(next);
                            return;
                          }
                          const next = pinnedMegaMenu === cat.id ? null : cat.id;
                          setPinnedMegaMenu(next);
                          setHoveredCat(next ?? null);
                          return;
                        }
                        setPinnedMegaMenu(null);
                        setHoveredCat(null);
                        navigate(`/product-category/${cat.slug}`);
                      }}
                      className={`group relative flex items-center gap-1 px-3 md:px-3.5 lg:px-4 xl:px-5 py-2.5 md:py-3 text-[12px] md:text-[13px] lg:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        isActive || isHovered ? "text-primary" : "text-foreground/65 hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                      {subs.length > 0 && (
                        <ChevronDown size={12} className={`text-muted-foreground/60 transition-transform duration-200 ${isHovered ? "rotate-180 text-primary" : ""}`} />
                      )}
                      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-primary transition-all duration-300 ${
                        isActive ? "w-2/3" : isHovered ? "w-1/3" : "w-0 group-hover:w-1/4"
                      }`} />
                    </button>

                    {/* Mega Menu */}
                    {subs.length > 0 && isHovered && (
                      <div
                        className="absolute inset-x-0 top-full z-50 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-200"
                        onMouseEnter={() => { if (canUseHover) openMegaMenu(cat.id); }}
                        onMouseLeave={() => { if (canUseHover) closeMegaMenu(); }}
                      >
                        <div className="mx-auto w-full max-w-[960px] px-3 xl:px-0">
                          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_16px_48px_-12px_hsl(var(--foreground)/0.15)]">
                            <div className="flex flex-col xl:flex-row xl:items-stretch">
                              {/* Featured sidebar */}
                              <div className="flex items-center gap-3 border-b border-border/40 bg-muted/25 px-4 py-3 xl:w-[200px] xl:flex-col xl:items-start xl:gap-0 xl:border-b-0 xl:border-r xl:px-5 xl:py-5">
                                <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                                  <Sparkles size={11} />
                                  Featured
                                </div>
                                <h3 className="text-sm font-display font-semibold text-foreground xl:mt-3 xl:text-xl">{cat.name}</h3>
                                <p className="hidden xl:block mt-1.5 text-xs leading-5 text-muted-foreground">
                                  Handpicked subcategories for faster browsing.
                                </p>
                                <Link
                                  to={`/product-category/${cat.slug}`}
                                  onClick={() => { setHoveredCat(null); setPinnedMegaMenu(null); }}
                                  className="ml-auto shrink-0 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:shadow-md transition-all hover:scale-[1.02] xl:ml-0 xl:mt-4 xl:px-4 xl:py-2 xl:text-xs"
                                >
                                  View all
                                </Link>
                              </div>

                              {/* Subcategories */}
                              <div className="flex-1 px-3 py-3 md:px-4 md:py-3.5 xl:px-5 xl:py-5">
                                <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-1">
                                  <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2 xl:mb-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Subcategories</p>
                                    <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">{subs.length} items</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3 xl:gap-2">
                                    {subs.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        to={`/product-category/${cat.slug}/${sub.slug}`}
                                        onClick={() => { setHoveredCat(null); setPinnedMegaMenu(null); }}
                                        className="group/item flex items-center justify-between gap-2 rounded-xl border border-transparent bg-muted/15 px-3 py-2 text-[12px] md:text-[13px] font-medium text-foreground/80 transition-all duration-200 hover:border-primary/15 hover:bg-primary/5 hover:text-primary xl:rounded-xl xl:px-3.5 xl:py-2.5"
                                      >
                                        <span className="flex min-w-0 items-center gap-2">
                                          <span className="flex h-5 w-5 xl:h-6 xl:w-6 shrink-0 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border/60 transition-all group-hover/item:bg-primary group-hover/item:text-primary-foreground group-hover/item:ring-primary/30">
                                            <span className="h-1 w-1 rounded-full bg-current" />
                                          </span>
                                          <span className="truncate text-[12px] xl:text-[13px] leading-5">{sub.name}</span>
                                        </span>
                                        <span className="shrink-0 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/50 transition-colors group-hover/item:bg-primary/8 group-hover/item:text-primary">
                                          {sub.product_count}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Static links */}
              {[
                { label: "Event Service", href: "/events", match: (p: string) => p.startsWith("/events") },
                { label: "Photography", href: "/photography", match: (p: string) => p === "/photography" },
                { label: "Custom Bouquet", href: "/custom-bouquet", match: (p: string) => p === "/custom-bouquet" },
              ].map((link) => {
                const isDuplicate = categories.some(
                  (cat) => cat.name.toLowerCase().replace(/\s+/g, '') === link.label.toLowerCase().replace(/\s+/g, '')
                );
                if (isDuplicate) return null;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`group relative px-3 md:px-3.5 lg:px-4 xl:px-5 py-2.5 md:py-3 text-[12px] md:text-[13px] lg:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      link.match(location.pathname) ? "text-primary" : "text-foreground/65 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-primary transition-all duration-300 ${
                      link.match(location.pathname) ? "w-2/3" : "w-0 group-hover:w-1/4"
                    }`} />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
