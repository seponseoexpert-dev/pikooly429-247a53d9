import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, X, User, Truck, ChevronDown, MapPinCheck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const staticNavLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { settings } = useSiteSettings();
  const { currencies, selectedCurrency, setSelectedCurrency, formatPrice } = useMultiCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const logoUrl = settings.company_logo || "";
  const announcementText = settings.announcement_bar_text || "🌸 Same Day Delivery Available in 500+ Cities";
  const showAnnouncement = settings.announcement_bar_enabled !== "false";

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
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Build nav links: static + dynamic categories
  const navLinks = [
    ...staticNavLinks,
    ...categories.map((c) => ({ label: c.name, href: `/shop?cat=${c.slug}` })),
  ];

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const isActiveLink = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname + location.search === href || location.pathname.startsWith(href.split("?")[0]) && href !== "/shop" ? false : location.pathname + location.search === href;
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
          {/* === ROW 1: Logo + Search + Icons (Desktop) / Logo + Icons (Mobile) === */}
          <div className="flex items-center h-12 sm:h-14 md:h-16 gap-3 md:gap-4">
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center">
              {logoUrl ? (
                <img src={logoUrl} alt={settings.store_name || "Store"} className="h-8 sm:h-9 md:h-10 w-auto object-contain" />
              ) : (
                <span className="text-lg sm:text-xl md:text-2xl font-display font-bold">
                  <span className="text-foreground">Pikooly</span>
                  <span className="text-primary">Flora</span>
                </span>
              )}
            </Link>

            {/* Desktop Search - centered, grows to fill space */}
            <div className="hidden md:block flex-1 max-w-xl mx-auto relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search flowers, cakes, gifts..."
                  className="w-full pl-11 pr-10 py-2.5 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
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
                        <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
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

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
              <Link to="/shop?cat=same-day" className="hidden md:flex flex-col items-center justify-center px-2 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Same Day Delivery">
                <Truck size={20} />
                <span className="text-[9px] font-medium mt-0.5 leading-none">Same Day</span>
              </Link>
              <Link to="/track-order" className="flex flex-col items-center justify-center px-2 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Track Order">
                <MapPinCheck size={20} />
                <span className="hidden md:block text-[9px] font-medium mt-0.5 leading-none">Track</span>
              </Link>
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex flex-col items-center justify-center px-2 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  aria-label="Currency"
                >
                  <span className="font-semibold w-5 h-5 flex items-center justify-center border border-foreground/30 rounded-full text-[11px]">
                    {selectedCurrency?.symbol || "$"}
                  </span>
                  <span className="hidden md:flex items-center text-[9px] font-medium mt-0.5 leading-none gap-0.5">
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
              <button onClick={() => setIsOpen(true)} className="relative flex flex-col items-center justify-center px-2 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" aria-label="Cart">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
                <span className="hidden md:block text-[9px] font-medium mt-0.5 leading-none">Cart</span>
              </button>
              <Link
                to={user ? "/account" : "/auth"}
                className="hidden sm:flex flex-col items-center justify-center px-2 py-1 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                aria-label="Account"
              >
                <User size={20} />
                <span className="hidden md:block text-[9px] font-medium mt-0.5 leading-none truncate max-w-[60px]">
                  {user ? "Account" : "Sign In"}
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
                placeholder="Search flowers, cakes, gifts..."
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
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
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

          {/* === ROW 2: Category Nav Bar (Desktop only) === */}
          <nav className="hidden md:flex items-center gap-1 border-t border-border/40 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`px-3 lg:px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${
                  (link.href === "/" && location.pathname === "/") ||
                  (link.href !== "/" && location.pathname + location.search === link.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
