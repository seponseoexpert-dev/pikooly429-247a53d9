import { X, Plus, Minus, ShoppingBag, Trash2, ImagePlus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, isOpen, setIsOpen } = useCart();
  const { formatPrice } = useMultiCurrency();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
                <ShoppingBag size={20} className="text-primary" /> Your Cart
                <span className="ml-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">{totalItems}</span>
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag size={36} className="opacity-40" />
                  </div>
                  <p className="font-semibold text-base text-foreground">Your cart is empty</p>
                  <p className="text-sm mt-1.5 text-muted-foreground">Start adding some beautiful gifts!</p>
                  <Button variant="outline" className="mt-5 rounded-full" onClick={() => setIsOpen(false)}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3.5 p-3 bg-secondary/50 rounded-2xl border border-border/30 hover:border-border/60 transition-colors"
                  >
                    <Link to={`/product/${item.product.id}`} onClick={() => setIsOpen(false)} className="flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl shadow-sm"
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <Link to={`/product/${item.product.id}`} onClick={() => setIsOpen(false)}>
                          <h4 className="font-semibold text-sm sm:text-[15px] text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
                            {item.product.name}
                          </h4>
                        </Link>
                        <p className="text-primary font-bold text-sm sm:text-base mt-1">{formatPrice(item.product.price)}</p>
                        {item.customImages && item.customImages.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <ImagePlus size={12} className="text-primary" /> {item.customImages.length} custom photo(s)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-card rounded-full border border-border px-1 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border bg-gradient-to-t from-secondary/30 to-transparent space-y-3">
                <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-primary text-lg sm:text-xl">{formatPrice(totalPrice)}</span>
                </div>
                <Link to="/checkout" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-full h-12 text-sm sm:text-base font-bold tracking-wide shadow-md hover:shadow-lg transition-shadow">
                    Proceed to Checkout
                  </Button>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
