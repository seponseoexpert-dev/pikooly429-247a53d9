import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useState, memo } from "react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

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

const ProductCard = memo(({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { formatPrice } = useMultiCurrency();
  const [isAdding, setIsAdding] = useState(false);
  const origPrice = product.original_price ?? product.originalPrice;
  const discount = origPrice
    ? Math.round((1 - product.price / origPrice) * 100)
    : 0;
  const imgSrc = product.image_url || product.image || "/placeholder.svg";
  const linkTo = `/product/${product.slug || product.id}`;

  return (
    <div className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-secondary/30">
        <img src={imgSrc} alt={product.name} width={300} height={300} decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold bg-primary text-primary-foreground rounded-full">
            {discount}% off
          </span>
        )}
      </Link>

      <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-1">
        <Link to={linkTo}>
          <h3 className="font-medium text-xs sm:text-sm md:text-base text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug min-h-[2.5em]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 sm:mt-2">
          <span className="font-bold text-primary text-sm sm:text-base">{formatPrice(product.price)}</span>
          {origPrice && (
            <span className="text-[10px] sm:text-xs text-muted-foreground line-through ml-1.5">{formatPrice(origPrice)}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            setIsAdding(true);
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: imgSrc,
              category: product.category || "",
              inStock: product.stock !== 0,
            });
            setTimeout(() => setIsAdding(false), 600);
          }}
          className="mt-2.5 sm:mt-3 w-full py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} className={isAdding ? "animate-bounce" : ""} />
          Add to Cart
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
