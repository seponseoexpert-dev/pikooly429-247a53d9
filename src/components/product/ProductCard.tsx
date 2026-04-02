import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
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
  const navigate = useNavigate();
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
        <img
          src={imgSrc}
          alt={product.name}
          width={300}
          height={300}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          sizes="(max-width: 480px) 44vw, (max-width: 640px) 45vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 20vw"
        />
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-bold bg-primary text-primary-foreground rounded-full">
            {discount}% off
          </span>
        )}
      </Link>

      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
        <Link to={linkTo}>
          <h3 className="font-medium text-[11px] sm:text-sm md:text-base text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug min-h-[2.2em] sm:min-h-[2.5em]">
            {product.name}
          </h3>
        </Link>

        {(product.rating ?? 0) > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < Math.round(product.rating!) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
              />
            ))}
          </div>
        )}

        <div className="mt-1 sm:mt-2">
          <span className="font-bold text-primary text-[13px] sm:text-base">{formatPrice(product.price)}</span>
          {origPrice && (
            <span className="text-[9px] sm:text-xs text-muted-foreground line-through ml-1">{formatPrice(origPrice)}</span>
          )}
        </div>

        <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: imgSrc,
                category: product.category || "",
                inStock: product.stock !== 0,
              }, undefined, true);
              navigate("/checkout");
            }}
            className="flex-1 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all uppercase tracking-wide text-center min-h-[36px] sm:min-h-[40px]"
          >
            Shop Now
          </button>
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
            className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97] transition-all flex items-center justify-center min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px]"
            aria-label="Add to Cart"
          >
            <ShoppingCart size={16} className={`sm:w-[18px] sm:h-[18px] ${isAdding ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
