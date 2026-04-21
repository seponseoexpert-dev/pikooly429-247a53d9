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
    <article className="luxe-card group relative flex flex-col h-full">
      {/* Image */}
      <Link to={linkTo} className="block premium-image relative overflow-hidden aspect-[4/5] bg-muted/20">
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={500}
          decoding="async"
          className="w-full h-full object-cover"
          loading="lazy"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />

        {/* Top-left: Discount badge — premium gold */}
        {discount > 0 && (
          <span
            className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md tracking-widest uppercase shadow-gold-glow z-10"
            style={{ background: "var(--gradient-gold)", color: "hsl(150 18% 11%)" }}
          >
            {discount}% Off
          </span>
        )}

        {/* Top-right: Wishlist heart */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/95 backdrop-blur-md border border-border/50 flex items-center justify-center hover:scale-110 hover:border-[hsl(var(--gold)/0.6)] active:scale-95 transition-all duration-500 ease-luxe opacity-0 group-hover:opacity-100 sm:opacity-100 z-10 shadow-sm"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-destructive text-destructive" : "text-foreground/70"} strokeWidth={2} />
        </button>

        {/* Bottom-left: Delivery time */}
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 pl-1 pr-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-background/95 backdrop-blur-md text-foreground rounded-full flex items-center gap-1 border border-border/40 shadow-sm z-10">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground">
              <Clock size={8} strokeWidth={2.5} />
            </span>
            <span className="truncate max-w-[90px]">{product.delivery_time}</span>
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-3.5 md:p-4 flex flex-col flex-1">
        {/* Rating + reviews */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <Star size={11} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" strokeWidth={0} />
            <span className="text-[10px] sm:text-[11px] font-semibold text-foreground tabular-nums">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground/70">·</span>
            <span className="text-[10px] text-muted-foreground/80 font-medium">In Stock</span>
          </div>
        )}

        {/* Title */}
        <Link to={linkTo}>
          <h3 className="font-display font-medium text-[13px] sm:text-[14px] md:text-[15px] text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-500 ease-luxe leading-snug tracking-tight">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="font-display font-semibold text-foreground text-[16px] sm:text-[17px] md:text-[18px] tracking-tight tabular-nums">
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
        <div className="flex gap-1.5 mt-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
              navigate("/checkout");
            }}
            className="flex-1 py-2.5 sm:py-3 rounded-full text-background text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-[0.14em] hover:shadow-luxe active:scale-[0.97] transition-all duration-500 ease-luxe min-h-[38px] sm:min-h-[42px] uppercase relative overflow-hidden"
            style={{ background: "var(--gradient-luxe)" }}
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
            className="px-3 py-2.5 sm:py-3 rounded-full border border-border hover:border-[hsl(var(--gold)/0.6)] text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--gold-light))] active:scale-[0.97] transition-all duration-500 ease-luxe flex items-center justify-center min-w-[38px] sm:min-w-[42px] min-h-[38px] sm:min-h-[42px]"
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
