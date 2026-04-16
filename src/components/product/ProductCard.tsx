import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Clock } from "lucide-react";
import { useState, memo, useMemo } from "react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { getOptimizedCloudinaryUrl } from "@/lib/imageUtils";

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
  const discount = origPrice ? Math.round((1 - product.price / origPrice) * 100) : 0;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 300), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;

  return (
    <div className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/30 hover:border-primary/20 hover:shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.1)] transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1 flex flex-col h-full">
      {/* Image */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-muted/10 p-2 sm:p-3">
        <img
          src={imgSrc}
          alt={product.name}
          width={300}
          height={300}
          decoding="async"
          className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-destructive text-destructive-foreground rounded-md shadow-sm">
            -{discount}%
          </span>
        )}
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 px-2 py-1 text-[9px] sm:text-[10px] font-medium bg-background/90 backdrop-blur-sm text-foreground rounded-lg flex items-center gap-1 shadow-sm">
            <Clock size={10} />
            {product.delivery_time}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-3 md:p-3.5 flex flex-col flex-1 gap-1">
        <Link to={linkTo}>
          <h3 className="font-medium text-[11px] sm:text-xs md:text-[13px] text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {(product.rating ?? 0) > 0 && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.round(product.rating!) ? "fill-amber-400 text-amber-400" : "text-border"} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-1.5">
          <span className="font-bold text-foreground text-sm sm:text-[15px] md:text-base">{formatPrice(product.price)}</span>
          {origPrice && origPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through ml-1.5">{formatPrice(origPrice)}</span>
          )}
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
              navigate("/checkout");
            }}
            className="flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-primary text-primary-foreground text-[10px] sm:text-[11px] md:text-xs font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all text-center min-h-[36px] sm:min-h-[40px]"
          >
            Shop Now
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsAdding(true);
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 });
              setTimeout(() => setIsAdding(false), 600);
            }}
            className="px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border/50 text-foreground/50 hover:border-primary/40 hover:text-primary active:scale-[0.97] transition-all flex items-center justify-center min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px]"
            aria-label="Add to Cart"
          >
            <ShoppingCart size={14} className={isAdding ? "animate-bounce" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
