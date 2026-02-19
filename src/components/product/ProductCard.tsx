import { Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    original_price?: number | null;
    originalPrice?: number;
    image?: string;
    image_url?: string | null;
    rating?: number | null;
    slug?: string;
    category?: string;
    badge?: string;
    inStock?: boolean;
    stock?: number;
  };
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const origPrice = product.original_price ?? product.originalPrice;
  const discount = origPrice
    ? Math.round((1 - product.price / origPrice) * 100)
    : 0;
  const imgSrc = product.image_url || product.image || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-300"
    >
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-secondary/50">
        <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <button
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-card/90 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={13} className="sm:w-[15px] sm:h-[15px]" />
        </button>
        {discount > 0 && (
          <span className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold bg-primary text-primary-foreground rounded-full">
            {discount}% off
          </span>
        )}
      </Link>

      <div className="p-2.5 sm:p-3 md:p-4">
        <Link to={linkTo}>
          <h3 className="font-medium text-xs sm:text-sm md:text-base text-foreground truncate hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
          <span className="font-bold text-foreground text-sm sm:text-base md:text-lg">৳ {product.price.toLocaleString()}</span>
          {product.rating && product.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground rounded">
              {product.rating} ★
            </span>
          )}
        </div>
        {origPrice && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground line-through">৳{origPrice.toLocaleString()}</span>
            <span className="text-[10px] sm:text-xs text-primary font-medium">{discount}% off</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
