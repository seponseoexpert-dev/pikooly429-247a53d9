import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useState, memo, useMemo, useCallback } from "react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
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
  const { formatPrice } = useMultiCurrency();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  const origPrice = product.original_price ?? product.originalPrice;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 360), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;

  const toggleLiked = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  }, []);

  const handleShopNow = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(linkTo);
  }, [navigate, linkTo]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: origPrice,
      image: rawImg,
      category: product.category || "",
      inStock: product.inStock ?? true,
    });
  }, [addItem, product, rawImg, origPrice]);

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-xl border border-[hsl(0_0%_92%)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      {/* Image - fixed 1:1 square aspect ratio for row consistency */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-[hsl(0_0%_98%)]">
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
          onClick={toggleLiked}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[hsl(0_0%_90%)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-[hsl(345_85%_58%)] text-[hsl(345_85%_58%)]" : "text-[hsl(0_0%_30%)]"} strokeWidth={1.8} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-3 flex flex-col flex-1">
        {/* Title — 3 lines on mobile, 2 on desktop */}
        <Link to={linkTo}>
          <h3 className="text-[13px] sm:text-[15px] text-[hsl(0_0%_12%)] line-clamp-3 sm:line-clamp-2 leading-[1.3] font-semibold min-h-[3.9em] sm:min-h-[2.6em]">
            {product.name}
          </h3>
        </Link>

        {/* Price row with inline % OFF pill badge */}
        <div className="mt-1.5 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          {origPrice && origPrice > product.price && (
            <span className="text-[11px] sm:text-[12px] text-[hsl(0_0%_55%)] line-through tabular-nums font-normal">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="font-bold text-[hsl(0_0%_10%)] text-[14px] sm:text-[16px] tabular-nums">
            {formatPrice(product.price)}
          </span>
          {origPrice && origPrice > product.price && (
            <span className="px-1.5 py-0.5 rounded-md bg-[hsl(142_70%_94%)] text-[hsl(142_71%_32%)] text-[10px] sm:text-[11px] font-bold tabular-nums">
              {Math.round(((origPrice - product.price) / origPrice) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Action buttons — SHOP NOW (light pink) + Cart Icon (outline) */}
        <div className="mt-2 flex items-stretch gap-1.5">
          <button
            onClick={handleShopNow}
            className="flex-1 h-8 sm:h-9 rounded-md bg-[hsl(350_100%_96%)] hover:bg-[hsl(350_100%_93%)] text-[hsl(345_80%_55%)] text-[11px] sm:text-[12px] font-bold tracking-wide uppercase transition-colors duration-200"
          >
            Shop Now
          </button>
          <button
            onClick={handleAddToCart}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-md border border-[hsl(350_85%_88%)] text-[hsl(345_80%_55%)] hover:bg-[hsl(350_100%_96%)] flex items-center justify-center transition-colors duration-200"
            aria-label="Add to Cart"
          >
            <ShoppingCart size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
