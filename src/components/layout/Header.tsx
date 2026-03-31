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

const staticNavLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Events", href: "/events" },
  { label: "Custom Bouquet", href: "/custom-bouquet" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [pinnedMegaMenu, setPinnedMegaMenu] = useState<string | null>(null);
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
  const navRef = useRef<HTMLElement>(null);

  const logoUrl = settings.company_logo || "";
  const announcementText = settings.announcement_bar_text || "🌸 Same Day Delivery Available in 500+ Cities";
  const showAnnouncement = !settingsLoading && settings.announcement_bar_enabled !== "false";

  const { data: allProducts = [] } = useQuery({
    queryKey: ["header-search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, image_url")
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
      // Fetch product counts per subcategory
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

  const navLinks = staticNavLinks;

  const suggestions = searchQuery.trim().length > 0
    ? allProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (megaMenuCloseTimer.current) {
        window.clearTimeout(megaMenuCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => setCanUseHover(mediaQuery.matches);

    updateHoverCapability();
    mediaQuery.addEventListener("change", updateHoverCapability);

    return () => mediaQuery.removeEventListener("change", updateHoverCapability);
  }, []);

  useEffect(() => {
    setHoveredCat(null);
  }, [location.pathname]);

  const openMegaMenu = (categoryId: string) => {
    if (megaMenuCloseTimer.current) {
      window.clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
    setHoveredCat(categoryId);
  };

  const closeMegaMenu = () => {
    if (megaMenuCloseTimer.current) {
      window.clearTimeout(megaMenuCloseTimer.current);
    }
    megaMenuCloseTimer.current = window.setTimeout(() => {
      setHoveredCat(null);
      megaMenuCloseTimer.current = null;
    }, 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSelect = (slug: string) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(`/product/${slug}`);
  };

  return (
    <>
      {showAnnouncement && (
        <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-4 font-medium">
          {announcementText}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card border-b border-border/50">
        <div className="section-container">
          {/* === ROW 1: Logo + Search + Icons === */}
          <div className="flex items-center h-12 sm:h-14 md:h-16 lg:h-[72px] gap-3 md:gap-5 lg:gap-8">
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center">
              {settingsLoading ? (
                <div className="h-8 sm:h-9 md:h-10 lg:h-11 w-24 sm:w-28 md:w-32 lg:w-36 bg-muted rounded animate-pulse" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={settings.store_name || "Store"}
                  width={140}
                  height={48}
                  decoding="async"
                  fetchPriority="high"
                  className="h-8 sm:h-9 md:h-10 lg:h-11 w-[96px] sm:w-[108px] md:w-[120px] lg:w-[140px] object-contain"
                />
              ) : (
                <span className="text-lg sm:text-xl md:text-2xl lg:text-[28px] font-display font-bold">
                  <span className="text-foreground">Pikooly</span>
                  <span className="text-primary">Flora</span>
                </span>
              )}
            </Link>

            {/* Desktop Search - centered, grows to fill space */}
            <div className="hidden md:block flex-1 max-w-lg lg:max-w-2xl mx-auto relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t("search_placeholder")}
                  className="w-full pl-12 pr-12 py-2.5 lg:py-3 rounded-full bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm lg:text-base transition-all"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-[100] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.slug)}
                      className="flex items-center gap-3 w-full px-5 py-3 hover:bg-muted transition-colors text-left"
                    >
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover shrink-0" loading="lazy" decoding="async" />
                      )}
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

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 ml-auto">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                <span className="hidden md:block text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>

              {multiLanguageEnabled && languages.length > 1 && (
                <div className="relative" ref={languageRef}>
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                    aria-label="Language"
                  >
                    <Globe size={20} />
                    <span className="hidden md:flex items-center text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none gap-0.5">
                      {language.code.toUpperCase()} <ChevronDown size={8} />
                    </span>
                  </button>
                  {showLanguageDropdown && (
                    <div className="absolute right-0 top-full mt-1 z-[100] bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px] max-h-[320px] overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang); setShowLanguageDropdown(false); }}
                          className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors ${
                            language.code === lang.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
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

              <Link to="/product-category/same-day" className="hidden md:flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Same Day Delivery">
                <Truck size={20} />
                <span className="text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none">{t("same_day")}</span>
              </Link>

              <Link to="/track-order" className="flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Track Order">
                <MapPinCheck size={20} />
                <span className="hidden md:block text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none">{t("track")}</span>
              </Link>

              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  aria-label="Currency"
                >
                  <span className="font-semibold w-5 h-5 flex items-center justify-center border border-foreground/30 rounded-full text-[11px]">
                    {selectedCurrency?.symbol || "$"}
                  </span>
                  <span className="hidden md:flex items-center text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none gap-0.5">
                    {selectedCurrency?.code || "USD"} <ChevronDown size={8} />
                  </span>
                </button>
                {showCurrencyDropdown && currencies.length > 1 && (
                  <div className="absolute right-0 top-full mt-1 z-[100] bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                    {currencies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCurrency(c); setShowCurrencyDropdown(false); }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors ${
                          selectedCurrency?.code === c.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                      >
                        <span className="w-5 text-center font-semibold">{c.symbol}</span>
                        <span>{c.code} - {c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setIsOpen(true)} className="relative flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Cart">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
                <span className="hidden md:block text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none">{t("cart")}</span>
              </button>

              <Link
                to={user ? "/account" : "/auth"}
                className="hidden sm:flex flex-col items-center justify-center px-2 lg:px-3 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                aria-label="Account"
              >
                <User size={20} />
                <span className="hidden md:block text-[9px] lg:text-[10px] font-medium mt-0.5 leading-none truncate max-w-[60px]">
                  {user ? t("account") : t("sign_in")}
                </span>
              </Link>
            </div>
          </div>

          {/* === MOBILE SEARCH (below logo row) === */}
          <div className="md:hidden pb-2.5 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t("search_placeholder")}
                className="w-full pl-11 pr-10 py-2.5 rounded-full bg-muted border border-border focus:border-primary outline-none text-sm"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              )}
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.slug)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
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

          {/* === ROW 2: Mega Nav Bar (Desktop only) === */}
          <nav className="hidden md:flex items-center justify-start xl:justify-center gap-0 border-t border-border/40 overflow-x-auto overflow-y-visible scrollbar-hide bg-card shadow-sm relative px-2 lg:px-4">
            {/* Static: Home */}
            <Link
              to="/"
              className={`group relative px-3 lg:px-4 xl:px-5 py-3 text-[13px] lg:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                location.pathname === "/" ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              Home
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-primary transition-all duration-300 ${location.pathname === "/" ? "w-3/4" : "w-0 group-hover:w-1/2"}`} />
            </Link>

            {/* Dynamic categories with mega menu */}
            {categories.map((cat) => {
              const subs = subsByCategory[cat.id] || [];
              const isActive = location.pathname.startsWith(`/product-category/${cat.slug}`);
              const isHovered = hoveredCat === cat.id;
              return (
                <div
                  key={cat.id}
                  className="static"
                  onMouseEnter={() => {
                    if (canUseHover && subs.length > 0) openMegaMenu(cat.id);
                  }}
                  onMouseLeave={() => {
                    if (canUseHover && subs.length > 0) closeMegaMenu();
                  }}
                >
                  <Link
                    to={`/product-category/${cat.slug}`}
                    onClick={(e) => {
                      if (subs.length > 0) {
                        e.preventDefault();
                        setHoveredCat((prev) => (prev === cat.id ? null : cat.id));
                        return;
                      }
                      setHoveredCat(null);
                    }}
                    className={`group relative flex items-center gap-1 px-3 lg:px-4 xl:px-5 py-3 text-[13px] lg:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive || isHovered
                        ? "text-primary"
                        : "text-foreground/70 hover:text-primary"
                    }`}
                  >
                    {cat.name}
                    {subs.length > 0 && (
                      <ChevronDown 
                        size={12} 
                        className={`text-muted-foreground transition-transform duration-200 ${isHovered ? "rotate-180 text-primary" : ""}`} 
                      />
                    )}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-primary transition-all duration-300 ${isActive ? "w-3/4" : isHovered ? "w-1/2" : "w-0"}`} />
                  </Link>

                  {/* Mega Dropdown */}
                  {subs.length > 0 && isHovered && (
                    <div
                      className="absolute inset-x-0 top-full z-50 pt-3 animate-in fade-in-0 slide-in-from-top-2 duration-200"
                      onMouseEnter={() => {
                        if (canUseHover) openMegaMenu(cat.id);
                      }}
                      onMouseLeave={() => {
                        if (canUseHover) closeMegaMenu();
                      }}
                    >
                      <div className="mx-auto w-full max-w-[980px] px-3 md:px-4 xl:px-0">
                        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_28px_90px_-24px_hsl(var(--foreground)/0.22)]">
                          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <div className="border-b border-border/60 bg-muted/35 px-5 py-5 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                              <Sparkles size={12} />
                              Featured
                            </div>
                            <h3 className="mt-4 text-xl font-display font-semibold text-foreground lg:text-2xl">{cat.name}</h3>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                              Tailored picks and handpicked subcategories for faster browsing.
                            </p>
                            <Link
                              to={`/product-category/${cat.slug}`}
                              onClick={() => setHoveredCat(null)}
                              className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.02]"
                            >
                              View all in {cat.name}
                            </Link>
                          </div>

                          <div className="bg-card px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
                            <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Popular subcategories
                                </p>
                                <p className="mt-1 text-sm text-foreground/80">Choose a collection and jump directly in.</p>
                              </div>
                              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                {subs.length} items
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
                              {subs.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/product-category/${cat.slug}/${sub.slug}`}
                                  onClick={() => setHoveredCat(null)}
                                  className="group/item flex min-h-[54px] items-center justify-between gap-3 rounded-2xl border border-transparent bg-muted/20 px-4 py-3 text-[13px] font-medium text-foreground/85 transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                >
                                  <span className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border transition-all group-hover/item:bg-primary group-hover/item:text-primary-foreground group-hover/item:ring-primary/30">
                                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    </span>
                                    <span className="truncate leading-5">{sub.name}</span>
                                  </span>
                                  <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border transition-colors group-hover/item:bg-primary/10 group-hover/item:text-primary">
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
                  )}
                </div>
              );
            })}

            {/* Static links that don't overlap with categories */}
            {[
              { label: "Event Service", href: "/events", match: (p: string) => p.startsWith("/events") },
              { label: "Custom Bouquet", href: "/custom-bouquet", match: (p: string) => p === "/custom-bouquet" },
              { label: "Blog", href: "/blog", match: (p: string) => p.startsWith("/blog") },
            ].map((link) => {
              const isDuplicate = categories.some(
                (cat) => cat.name.toLowerCase().replace(/\s+/g, '') === link.label.toLowerCase().replace(/\s+/g, '')
              );
              if (isDuplicate) return null;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`group relative px-3 lg:px-4 xl:px-5 py-3 text-[13px] lg:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    link.match(location.pathname) ? "text-primary" : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-primary transition-all duration-300 ${link.match(location.pathname) ? "w-3/4" : "w-0 group-hover:w-1/2"}`} />
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
