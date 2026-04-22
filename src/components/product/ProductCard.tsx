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
    <article className="group relative flex flex-col h-full bg-white rounded-xl border border-[hsl(0_0%_92%)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      {/* Image */}
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[hsl(0_0%_90%)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-[hsl(345_85%_58%)] text-[hsl(345_85%_58%)]" : "text-[hsl(0_0%_30%)]"} strokeWidth={1.8} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        {/* Title */}
        <Link to={linkTo}>
          <h3 className="text-[12.5px] sm:text-[13.5px] text-[hsl(0_0%_15%)] line-clamp-1 leading-snug font-normal">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          {origPrice && origPrice > product.price && (
            <span className="text-[11.5px] sm:text-[13px] text-[hsl(0_0%_55%)] line-through tabular-nums font-normal">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="font-bold text-[hsl(0_0%_10%)] text-[14px] sm:text-[15.5px] tabular-nums">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Rating + sold */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-[12px]">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-[hsl(142_71%_40%)] text-[hsl(142_71%_40%)]" strokeWidth={0} />
            <span className="font-semibold text-[hsl(0_0%_15%)] tabular-nums">{rating > 0 ? rating.toFixed(1) : "—"}</span>
          </div>
          {sold > 0 && (
            <>
              <span className="text-[hsl(0_0%_82%)]">|</span>
              <span className="text-[hsl(0_0%_45%)] tabular-nums">{sold} sold</span>
            </>
          )}
        </div>

        {/* Split action button - coral/pink outlined */}
        <div className="mt-2.5 flex items-stretch rounded-md border border-[hsl(345_85%_70%)] bg-white overflow-hidden hover:border-[hsl(345_85%_60%)] transition-colors duration-300">
          <button
            onClick={handleBuyNow}
            className="flex-1 py-1.5 sm:py-2 text-[hsl(345_82%_55%)] font-semibold text-[12px] sm:text-[13px] text-center hover:bg-[hsl(345_85%_97%)] active:scale-[0.98] transition-all"
          >
            Shop Now
          </button>
          <span className="w-px bg-[hsl(345_85%_70%)] my-1" />
          <button
            onClick={handleAddToCart}
            aria-label="Add to Cart"
            className="px-3 sm:px-4 flex items-center justify-center text-[hsl(345_82%_55%)] hover:bg-[hsl(345_85%_97%)] active:scale-[0.95] transition-all"
          >
            <ShoppingCart size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
