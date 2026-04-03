import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Clock } from "lucide-react";
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
    delivery_time?: string | null;
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
    <div className="group bg-card rounded-xl overflow-hidden border border-border/40 hover:border-border hover:shadow-md transition-all duration-300 flex flex-col">
      <Link to={linkTo} className="block relative overflow-hidden aspect-[4/5] bg-muted/30">
        <img
          src={imgSrc}
          alt={product.name}
          width={300}
          height={375}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          loading="lazy"
          sizes="(max-width: 480px) 44vw, (max-width: 640px) 45vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 20vw"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-primary text-primary-foreground rounded-md">
            -{discount}%
          </span>
        )}
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-accent text-accent-foreground rounded-md flex items-center gap-1">
            <Clock size={10} />
            {product.delivery_time}
          </span>
        )}
      </Link>

      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 gap-1">
        <Link to={linkTo}>
          <h3 className="font-medium text-[11px] sm:text-[13px] text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {(product.rating ?? 0) > 0 && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < Math.round(product.rating!) ? "fill-amber-400 text-amber-400" : "text-border"}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-1">
          <span className="font-semibold text-foreground text-[13px] sm:text-[15px]">{formatPrice(product.price)}</span>
          {origPrice && (
            <span className="text-[10px] sm:text-xs text-muted-foreground line-through ml-1.5">{formatPrice(origPrice)}</span>
          )}
        </div>

        <div className="flex gap-1.5 mt-1.5">
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
            className="flex-1 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all text-center min-h-[36px] sm:min-h-[40px]"
          >
            Buy Now
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
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-border text-foreground/70 hover:border-primary hover:text-primary active:scale-[0.97] transition-all flex items-center justify-center min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px]"
            aria-label="Add to Cart"
          >
            <ShoppingCart size={15} className={`sm:w-4 sm:h-4 ${isAdding ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
