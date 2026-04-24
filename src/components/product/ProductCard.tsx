import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { getOptimizedCloudinaryUrl } from "@/lib/imageUtils";
import { getEarliestDeliveryLabel } from "@/lib/deliveryResolver";

const PREFERRED_DISTRICT_KEY = "preferred_delivery_district";


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
  const [district, setDistrict] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(PREFERRED_DISTRICT_KEY) : null
  );

  // Sync when district changes elsewhere on the page (Product detail / Cart)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFERRED_DISTRICT_KEY) setDistrict(e.newValue);
    };
    const onCustom = () => setDistrict(localStorage.getItem(PREFERRED_DISTRICT_KEY));
    window.addEventListener("storage", onStorage);
    window.addEventListener("delivery-district-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("delivery-district-changed", onCustom);
    };
  }, []);

  const origPrice = product.original_price ?? product.originalPrice;
  const rawImg = product.image_url || product.image || "/placeholder.svg";
  const imgSrc = useMemo(() => getOptimizedCloudinaryUrl(rawImg, 360), [rawImg]);
  const linkTo = `/product/${product.slug || product.id}`;
  const rating = product.rating ?? 0;
  const sold = product.review_count ?? 0;

  // Earliest delivery label — uses saved district if any, else fastest possible
  const earliestLabel = useMemo(
    () =>
      getEarliestDeliveryLabel(
        {
          // ProductCardProps doesn't carry the district arrays; fall back to time text
          // We let getEarliestDeliveryLabel use standard_delivery_days default
          standard_delivery_days: undefined,
        },
        district
      ),
    [district]
  );


  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 });
  }, [addItem, product.id, product.name, product.price, imgSrc, product.category, product.stock]);

  const handleBuyNow = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: imgSrc, category: product.category || "", inStock: product.stock !== 0 }, undefined, true);
    navigate("/checkout");
  }, [addItem, navigate, product.id, product.name, product.price, imgSrc, product.category, product.stock]);

  const toggleLiked = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  }, []);

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-xl border border-[hsl(0_0%_92%)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      {/* Image */}
      <Link to={linkTo} className="block relative overflow-hidden aspect-[4/5] bg-[hsl(0_0%_98%)]">
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

        {/* (Delivery badge removed — now shown as text below price, FNP-style) */}


        {/* Wishlist heart - top right */}
        <button
          onClick={toggleLiked}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[hsl(0_0%_90%)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Add to Wishlist"
        >
          <Heart size={13} className={liked ? "fill-[hsl(345_85%_58%)] text-[hsl(345_85%_58%)]" : "text-[hsl(0_0%_30%)]"} strokeWidth={1.8} />
        </button>
      </Link>

      {/* Content — FNP style: clean, no buttons, no rating row */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title — 2 lines like FNP */}
        <Link to={linkTo}>
          <h3 className="text-[14px] sm:text-[15.5px] text-[hsl(0_0%_15%)] line-clamp-2 leading-snug font-normal min-h-[2.6em]">
            {product.name}
          </h3>
        </Link>

        {/* Price row with inline % OFF badge — FNP style */}
        <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2 gap-y-1">
          {origPrice && origPrice > product.price && (
            <span className="text-[13px] sm:text-[14px] text-[hsl(0_0%_55%)] line-through tabular-nums font-normal">
              {formatPrice(origPrice)}
            </span>
          )}
          <span className="font-bold text-[hsl(0_0%_10%)] text-[17px] sm:text-[19px] tabular-nums">
            {formatPrice(product.price)}
          </span>
          {origPrice && origPrice > product.price && (
            <span className="text-[11px] sm:text-[12px] font-bold text-[hsl(142_71%_32%)] bg-[hsl(142_71%_92%)] px-1.5 py-0.5 rounded-sm tabular-nums">
              {Math.round(((origPrice - product.price) / origPrice) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Earliest Delivery line — FNP-style: blue, bold, no border */}
        <p className="mt-2 text-[13px] sm:text-[14px] text-[hsl(210_85%_45%)] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          Earliest Delivery : <span className="font-bold">{earliestLabel}</span>
        </p>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
