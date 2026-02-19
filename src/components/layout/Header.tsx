import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Flowers", href: "/shop?cat=flowers" },
  { label: "Cakes", href: "/shop?cat=cake" },
  { label: "Gifts", href: "/shop?cat=combos" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-4 font-medium">
        🌸 Same Day Delivery Available in 500+ Cities
      </div>

      <header className="sticky top-0 z-50 bg-card border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 sm:p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-lg sm:text-xl md:text-2xl font-display font-bold">
                <span className="text-foreground">Pikooly</span>
                <span className="text-primary">Flora</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 sm:p-2 text-foreground"
                aria-label="Search"
              >
                <Search size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-1.5 sm:p-2 text-foreground"
                aria-label="Cart"
              >
                <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] sm:text-[10px] w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
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
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search flowers, cakes, gifts..."
                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 rounded-full bg-muted border border-border focus:border-primary outline-none text-xs sm:text-sm"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 top-[calc(2rem+3rem)] sm:top-[calc(2rem+3.5rem)] z-40 bg-card md:hidden"
            >
              <nav className="flex flex-col p-4 sm:p-6 gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-2.5 sm:py-3 px-3 sm:px-4 text-base sm:text-lg font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-all"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
