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
    <article className="group relative bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-500 ease-out hover:shadow-[0_12px_32px_-12px_hsl(var(--foreground)/0.12)] flex flex-col h-full">
      {/* Image */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-[4/5] bg-muted/20">
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={500}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          loading="lazy"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />

        {/* Top-left: Discount badge — minimal */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 text-[10px] font-bold bg-foreground text-background rounded tracking-wider uppercase">
            {discount}% Off
          </span>
        )}

        {/* Top-right: Wishlist heart — refined */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/95 backdrop-blur flex items-center justify-center hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-destructive text-destructive" : "text-foreground/70"} strokeWidth={2} />
        </button>

        {/* Bottom-left: Delivery time — clean pill */}
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 pl-1 pr-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-background/95 backdrop-blur text-foreground rounded-full flex items-center gap-1 border border-border/40">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground">
              <Clock size={8} strokeWidth={2.5} />
            </span>
            <span className="truncate max-w-[90px]">{product.delivery_time}</span>
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-3 md:p-3.5 flex flex-col flex-1">
        {/* Rating + reviews */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Star size={11} className="fill-foreground text-foreground" strokeWidth={0} />
            <span className="text-[10px] sm:text-[11px] font-semibold text-foreground tabular-nums">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground/70">·</span>
            <span className="text-[10px] text-muted-foreground/80">In Stock</span>
          </div>
        )}

        {/* Title */}
        <Link to={linkTo}>
          <h3 className="font-medium text-[12px] sm:text-[13px] md:text-[14px] text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2 pt-2 border-t border-border/40 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="font-bold text-foreground text-[15px] sm:text-base md:text-[17px] tracking-tight tabular-nums">
              {formatPrice(product.price)}
            </span>
            {origPrice && origPrice > product.price && (
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 line-through tabular-nums">
                {formatPrice(origPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
              navigate("/checkout");
            }}
            className="flex-1 py-2 sm:py-2.5 rounded-lg bg-foreground text-background text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-wide hover:bg-foreground/90 active:scale-[0.97] transition-all min-h-[36px] sm:min-h-[40px] uppercase"
          >
            Buy Now
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsAdding(true);
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 });
              setTimeout(() => setIsAdding(false), 600);
            }}
            className="px-2.5 py-2 sm:py-2.5 rounded-lg border border-border hover:border-foreground/40 text-foreground/70 hover:text-foreground active:scale-[0.97] transition-all flex items-center justify-center min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px]"
            aria-label="Add to Cart"
          >
            <ShoppingBag size={14} className={isAdding ? "animate-bounce" : ""} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
