import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Star, Clock, Heart } from "lucide-react";
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
  const [liked, setLiked] = useState(false);
  const origPrice = product.original_price ?? product.originalPrice;
  const discount = origPrice ? Math.round((1 - product.price / origPrice) * 100) : 0;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 400), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;
  const rating = product.rating ?? 0;

  return (
    <div className="group relative bg-card rounded-2xl sm:rounded-[22px] overflow-hidden ring-1 ring-border/40 hover:ring-primary/30 shadow-[0_2px_12px_-4px_hsl(var(--foreground)/0.06)] hover:shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.25)] transition-all duration-500 ease-out hover:-translate-y-1.5 flex flex-col h-full">
      {/* Image */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-[4/5] bg-gradient-to-br from-muted/30 to-muted/10">
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={500}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          loading="lazy"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top-left: Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-1 text-[10px] sm:text-[11px] font-bold bg-destructive text-destructive-foreground rounded-lg shadow-lg shadow-destructive/30 tracking-wide">
            −{discount}%
          </span>
        )}

        {/* Top-right: Wishlist heart */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all border border-border/40"
          aria-label="Add to Wishlist"
        >
          <Heart size={14} className={liked ? "fill-destructive text-destructive" : "text-foreground/60"} strokeWidth={2.2} />
        </button>

        {/* Bottom-left: Delivery time pill */}
        {product.delivery_time && (
          <span className="absolute bottom-2.5 left-2.5 pl-1 pr-2.5 py-1 text-[9px] sm:text-[10px] font-semibold bg-background/95 backdrop-blur-md text-foreground rounded-full flex items-center gap-1.5 shadow-lg border border-border/40">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground">
              <Clock size={9} strokeWidth={2.5} />
            </span>
            <span className="truncate max-w-[100px]">{product.delivery_time}</span>
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-3 md:p-3.5 flex flex-col flex-1 gap-1.5">
        <Link to={linkTo}>
          <h3 className="font-semibold text-[12px] sm:text-[13px] md:text-[14px] text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug tracking-tight">
            {product.name}
          </h3>
        </Link>

        {/* Rating row */}
        {rating > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10">
              <Star size={10} className="fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{rating.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className="h-[18px]" />
        )}

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-bold text-foreground text-[15px] sm:text-base md:text-[17px] tracking-tight">
            {formatPrice(product.price)}
          </span>
          {origPrice && origPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 line-through">
              {formatPrice(origPrice)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
              navigate("/checkout");
            }}
            className="flex-1 relative overflow-hidden py-2 sm:py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground text-[10px] sm:text-[11px] md:text-xs font-bold tracking-wide hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] transition-all min-h-[36px] sm:min-h-[40px] group/btn"
          >
            <span className="relative z-10">Shop Now</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsAdding(true);
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 });
              setTimeout(() => setIsAdding(false), 600);
            }}
            className="px-2.5 py-2 sm:py-2.5 rounded-xl bg-muted/60 hover:bg-primary/10 text-foreground/70 hover:text-primary active:scale-[0.97] transition-all flex items-center justify-center min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px]"
            aria-label="Add to Cart"
          >
            <ShoppingBag size={14} className={isAdding ? "animate-bounce" : ""} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
