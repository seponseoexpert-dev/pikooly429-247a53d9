import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-400"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
            {product.badge}
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold bg-accent text-accent-foreground rounded-full">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
        <button
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-card transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
      </Link>

      {/* Info */}
      <div className="p-3 md:p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm md:text-base text-foreground truncate hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="fill-gold text-gold" />
            <span className="text-xs text-muted-foreground">{product.rating}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-base">৳{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
            aria-label="Add to cart"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;