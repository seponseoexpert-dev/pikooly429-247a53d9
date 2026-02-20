import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Flowers", href: "/shop?cat=flowers" },
  { label: "Cakes", href: "/shop?cat=cake" },
  { label: "Gifts", href: "/shop?cat=combos" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const logoUrl = settings.company_logo || "";
  const currencySymbol = settings.currency_symbol || "৳";
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

  const suggestions = searchQuery.trim().length > 0
    ? allProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
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

  return (
    <>
      {showAnnouncement && (
        <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-4 font-medium">
          {announcementText}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-12 sm:h-14 gap-2">
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

            <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button className="p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted flex items-center justify-center" aria-label="Currency">
                <span className="font-semibold w-5 h-5 flex items-center justify-center border border-foreground/30 rounded-full text-[11px]">
                  {currencySymbol}
                </span>
              </button>
              <button onClick={() => setIsOpen(true)} className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted" aria-label="Cart">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search with suggestions */}
          <div className="pb-2.5 relative" ref={searchRef}>
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
                        ৳{p.price}
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-muted-foreground line-through ml-1.5">৳{p.original_price}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
