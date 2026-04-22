import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Heart } from "lucide-react";
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
    review_count?: number | null;
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
  const [liked, setLiked] = useState(false);
  const origPrice = product.original_price ?? product.originalPrice;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 400), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;
  const rating = product.rating ?? 0;
  const sold = product.review_count ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
    navigate("/checkout");
  };

  return (
    <article className="group relative flex flex-col h-full bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-500 ease-luxe hover:border-primary/30 hover:shadow-lg">
      {/* Image */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-muted/20">
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={400}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
          loading="lazy"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />

        {/* Wishlist heart - top right */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm z-10"
          aria-label="Add to Wishlist"
        >
          <Heart size={14} className={liked ? "fill-primary text-primary" : "text-foreground/60"} strokeWidth={2} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title */}
        <Link to={linkTo}>
          <h3 className="font-medium text-[13px] sm:text-[14px] text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-1.5 flex items-baseline gap-2">
          {origPrice && origPrice > product.price && (
            <span className="text-[12px] sm:text-[13px] text-muted-foreground/70 line-through tabular-nums">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="font-bold text-foreground text-[15px] sm:text-[16px] tabular-nums">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Rating + sold */}
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] sm:text-[12px]">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-[hsl(142_70%_42%)] text-[hsl(142_70%_42%)]" strokeWidth={0} />
            <span className="font-semibold text-foreground tabular-nums">{rating > 0 ? rating.toFixed(1) : "—"}</span>
          </div>
          {sold > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="text-muted-foreground tabular-nums">{sold} sold</span>
            </>
          )}
        </div>

        {/* Split action button */}
        <button
          onClick={handleBuyNow}
          className="mt-3 flex items-stretch rounded-lg border border-primary/40 overflow-hidden hover:border-primary hover:shadow-sm active:scale-[0.98] transition-all duration-300 group/btn"
        >
          <span className="flex-1 py-2 text-primary font-semibold text-[12px] sm:text-[13px] text-center group-hover/btn:bg-primary/5 transition-colors">
            Shop Now
          </span>
          <span
            onClick={handleAddToCart}
            role="button"
            aria-label="Add to Cart"
            className="px-3 flex items-center justify-center border-l border-primary/40 text-primary group-hover/btn:bg-primary/5 transition-colors"
          >
            <ShoppingCart size={15} strokeWidth={2} />
          </span>
        </button>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
