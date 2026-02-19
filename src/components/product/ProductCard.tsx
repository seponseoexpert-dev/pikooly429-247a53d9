import { Heart } from "lucide-react";
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
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square bg-secondary/50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Wishlist heart */}
        <button
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-card/90 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={15} />
        </button>
        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 text-[11px] font-bold bg-primary text-primary-foreground rounded-full">
            {discount}% off
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-bold text-foreground text-base">৳ {product.price.toLocaleString()}</span>
          {product.rating && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">
              {product.rating} ★
            </span>
          )}
        </div>
        {product.originalPrice && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground line-through">৳{product.originalPrice.toLocaleString()}</span>
            <span className="text-xs text-primary font-medium">{discount}% off</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
