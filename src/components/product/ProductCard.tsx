import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { memo, useMemo, useState, useCallback } from "react";
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
  const { formatPrice } = useMultiCurrency();
  const [liked, setLiked] = useState(false);

  const origPrice = product.original_price ?? product.originalPrice;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 360), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;
  const rating = Number(product.rating ?? 0).toFixed(1);
  const reviewCount = product.review_count ?? 0;
  const discount =
    origPrice && origPrice > product.price
      ? Math.round(((origPrice - product.price) / origPrice) * 100)
      : 0;

  const toggleLiked = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  }, []);

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-[20px] border border-[hsl(0_0%_92%)] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-300">
      {/* Image - 1:1 square */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-square bg-[hsl(0_0%_98%)]">
        <img
          src={imgSrc}
          alt={product.name}
          width={400}
          height={400}
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
          sizes="(max-width: 480px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
        />
        {product.delivery_time && (
          <span className="absolute bottom-2 left-2 bg-white/95 text-[hsl(280_60%_35%)] text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-md shadow-sm">
            ⚡ {product.delivery_time}
          </span>
        )}
        <button
          onClick={toggleLiked}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[hsl(0_0%_90%)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-[hsl(345_85%_58%)] text-[hsl(345_85%_58%)]" : "text-[hsl(0_0%_30%)]"} strokeWidth={1.8} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title — 2 lines max */}
        <Link to={linkTo} className="block min-w-0">
          <h3 className="text-[14px] sm:text-[14px] text-[hsl(0_0%_12%)] leading-[1.35] font-semibold line-clamp-2 min-h-[2.7em]">
            {product.name}
          </h3>
        </Link>

        {/* Price row — price + badge always visible; origPrice truncates first */}
        <div className="mt-1.5 flex items-baseline gap-x-1.5 sm:gap-x-2 whitespace-nowrap min-w-0">
          <span className="font-bold text-[hsl(280_60%_35%)] text-[16px] sm:text-[16px] leading-none tabular-nums shrink-0">
            {formatPrice(product.price)}
          </span>
          {origPrice && origPrice > product.price && (
            <span className="text-[12px] sm:text-[12px] leading-none text-[hsl(0_0%_55%)] line-through tabular-nums min-w-0 overflow-hidden text-ellipsis">
              {formatPrice(origPrice)}
            </span>
          )}
          {discount > 0 && (
            <span className="ml-auto px-1.5 py-[2px] sm:py-0.5 rounded-md bg-[hsl(142_70%_94%)] text-[hsl(142_71%_32%)] text-[10px] sm:text-[11px] leading-none font-bold tabular-nums shrink-0 whitespace-nowrap">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Rating row — green pill + reviews */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-[hsl(142_71%_38%)] text-white text-[12px] font-bold px-2 py-0.5 rounded-md">
            <Star size={11} className="fill-white text-white" strokeWidth={0} />
            {rating}
          </span>
          <span className="text-[12px] text-[hsl(0_0%_45%)]">({reviewCount} Reviews)</span>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
