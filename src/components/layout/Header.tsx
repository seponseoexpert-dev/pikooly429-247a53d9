import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, MapPin, ChevronDown, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Flowers", href: "/shop?cat=flowers" },
  { label: "Cakes", href: "/shop?cat=cake" },
  { label: "Gifts", href: "/shop?cat=combos" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems, setIsOpen } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const logoUrl = settings.company_logo || "";
  const currencySymbol = settings.currency_symbol || "৳";
  const deliveryText = settings.header_delivery_text || "Where to deliver?";
  const deliverySubtext = settings.header_delivery_subtext || "Select location";
  const announcementText = settings.announcement_bar_text || "🌸 Same Day Delivery Available in 500+ Cities";
  const showAnnouncement = settings.announcement_bar_enabled !== "false";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-4 font-medium">
          {announcementText}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={settings.store_name || "Store"}
                  className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-lg sm:text-xl md:text-2xl font-display font-bold">
                  <span className="text-foreground">Pikooly</span>
                  <span className="text-primary">Flora</span>
                </span>
              )}
            </Link>

            {/* Delivery Location - mobile & desktop */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-left min-w-0 max-w-[220px]">
              <MapPin size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate leading-tight">{deliveryText}</p>
                <p className="text-[10px] text-primary truncate leading-tight flex items-center gap-0.5">
                  {deliverySubtext} <ChevronDown size={10} />
                </p>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Currency */}
              <button
                className="p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted hidden sm:flex items-center justify-center"
                aria-label="Currency"
              >
                <span className="text-base font-semibold w-5 h-5 flex items-center justify-center border border-foreground/30 rounded-full text-[11px]">
                  {currencySymbol}
                </span>
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile: Delivery location bar */}
          <div className="sm:hidden pb-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted text-left">
              <MapPin size={16} className="text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate leading-tight">{deliveryText}</p>
                <p className="text-[10px] text-primary truncate leading-tight flex items-center gap-0.5">
                  {deliverySubtext} <ChevronDown size={10} />
                </p>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pb-3"
              >
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search flowers, cakes, gifts..."
                    className="w-full pl-11 pr-10 py-2.5 rounded-full bg-muted border border-border focus:border-primary outline-none text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
};

export default Header;
