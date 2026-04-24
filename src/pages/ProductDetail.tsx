import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { useCart, VariantSelection } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, Phone, MessageCircle, Type, X, ChevronLeft, ChevronRight, Facebook, Twitter, Link2, Check, Ruler, Palette } from "lucide-react";
import { parseDeliveryBadge } from "@/lib/deliveryBadge";
import { useState, useMemo, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ProductDetailSkeleton } from "@/components/ui/skeletons";
import ReviewSection from "@/components/product/ReviewSection";
import CustomImageUpload from "@/components/product/CustomImageUpload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { settings } = useSiteSettings();
  const { formatPrice } = useMultiCurrency();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "instructions" | "delivery" | "reviews">("description");
  const [customImages, setCustomImages] = useState<File[]>([]);
  const [customText, setCustomText] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      let { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug, allow_custom_image, allow_custom_text)")
        .eq("slug", id!)
        .maybeSingle();
      if (!data) {
        ({ data, error } = await supabase
          .from("products")
          .select("*, categories(name, slug, allow_custom_image, allow_custom_text)")
          .eq("id", id!)
          .maybeSingle());
      }
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, image_url, rating, review_count, stock, delivery_time, categories(name, slug)")
        .eq("is_active", true)
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Check product-level personalization flags first, fallback to category
  const allowCustomImage = !!(product as any)?.allow_custom_image || !!(product?.categories as any)?.allow_custom_image;
  const allowCustomText = !!(product as any)?.allow_custom_text || !!(product?.categories as any)?.allow_custom_text;

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const siteName = settings.site_title || "Pikooly";
  const seoTitle = product ? ((product as any).seo_title || `${product.name} - ${siteName}`) : siteName;
  const seoDesc = product ? stripHtml((product as any).seo_description || product.description || "").slice(0, 160) : "";
  const siteUrl = window.location.origin;

  // Fetch approved reviews for Review schema
  const { data: reviewsData = [] } = useQuery({
    queryKey: ["product-reviews-schema", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("customer_name, rating, comment, created_at")
        .eq("product_id", product!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  const productJsonLd = useMemo(() => {
    if (!product) return undefined;
    const productUrl = `${siteUrl}/product/${product.slug || product.id}`;

    const productSchema: Record<string, any> = {
      "@type": "Product",
      name: product.name,
      description: stripHtml(product.description || "").slice(0, 300),
      image: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
      url: productUrl,
      sku: product.id,
      brand: { "@type": "Brand", name: siteName },
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "BDT",
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: productUrl,
        priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        ...(product.original_price && product.original_price > product.price ? {
          highPrice: product.original_price,
        } : {}),
        seller: { "@type": "Organization", name: siteName },
      },
    };

    if (product.rating && product.review_count) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        bestRating: 5,
        worstRating: 1,
        reviewCount: product.review_count,
      };
    }

    if (reviewsData.length > 0) {
      productSchema.review = reviewsData.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.customer_name },
        datePublished: r.created_at?.split("T")[0],
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
        },
        ...(r.comment ? { reviewBody: r.comment } : {}),
      }));
    }

    // BreadcrumbList
    const breadcrumbItems = [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/shop` },
    ];
    if (product.categories?.name) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: product.categories.name,
        item: `${siteUrl}/product-category/${product.categories.slug}`,
      });
      breadcrumbItems.push({ "@type": "ListItem", position: 4, name: product.name, item: productUrl });
    } else {
      breadcrumbItems.push({ "@type": "ListItem", position: 3, name: product.name, item: productUrl });
    }

    return {
      "@context": "https://schema.org",
      "@graph": [
        productSchema,
        {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        },
      ],
    };
  }, [product, siteName, siteUrl, reviewsData]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <main className="section-container py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/shop" className="text-primary mt-4 inline-block text-sm">← Back to shop</Link>
      </main>
    );
  }

  const mainImg = product.image_url || "/placeholder.svg";
  const allImages = product.images?.length ? product.images : [mainImg];
  const currentImg = allImages[selectedImage] || mainImg;

  // Delivery badge based on product.delivery_time
  const deliveryBadge = parseDeliveryBadge(product.delivery_time);

  const cartProduct = {
    id: product.id,
    name: customText.trim() ? `${product.name} (Personalized: ${customText.trim()})` : product.name,
    price: product.price,
    originalPrice: product.original_price ?? undefined,
    image: mainImg,
    category: product.categories?.slug || "",
    inStock: product.stock > 0,
  };

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(cartProduct, customImages.length ? customImages : undefined);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addItem(cartProduct, customImages.length ? customImages : undefined, true);
    navigate("/checkout");
  };

  const orderWhatsApp = settings.order_whatsapp_number || settings.whatsapp_number || "";
  const orderPhone = settings.order_phone_number || settings.store_phone || "";
  const whatsappUrl = orderWhatsApp ? `https://wa.me/${orderWhatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I want to order: ${product.name} (${formatPrice(product.price)}) x ${qty}`)}` : "";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="section-container py-3 sm:py-4 md:py-6 lg:py-8 pb-24 md:pb-10">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={`${siteUrl}/product/${product.slug || product.id}`}
        ogImage={product.image_url || ""}
        ogType="product"
        jsonLd={productJsonLd}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>›</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Products</Link>
        {product.categories?.name && (
          <>
            <span>›</span>
            <span className="text-foreground">{product.categories.name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 lg:gap-12">
        {/* Image Gallery - FNP style with side thumbnails + hover zoom */}
        <div className="flex gap-3">
          {allImages.length > 1 && (
            <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                    selectedImage === i ? "border-primary shadow-sm" : "border-border/40 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Main image with constrained size */}
            <div
              className="w-full max-w-[520px] lg:max-w-[560px] mx-auto aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-muted/10 border border-border/30 shadow-sm cursor-zoom-in relative group"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setLightboxOpen(true)}
            >
              <img src={currentImg} alt={product.name} className="w-full h-full object-contain p-2 sm:p-3" loading="eager" fetchPriority="high" />
              {/* Delivery time badge */}
              {deliveryBadge && (
                <div className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-br ${deliveryBadge.gradient} ${deliveryBadge.glow} backdrop-blur-sm ring-1 ring-white/30 pointer-events-none`}>
                  <deliveryBadge.Icon size={13} className="text-white" strokeWidth={2.5} />
                  <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wide leading-none whitespace-nowrap">
                    {deliveryBadge.label}
                  </span>
                </div>
              )}
              {/* Zoom overlay on hover (desktop only) */}
              {isZooming && (
                <div
                  className="absolute inset-0 hidden md:block pointer-events-none"
                  style={{
                    backgroundImage: `url(${currentImg})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
              <span className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Click to expand
              </span>
            </div>
            {allImages.length > 1 && (
              <div className="flex md:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide mt-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                      selectedImage === i ? "border-primary shadow-sm" : "border-border/40 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setLightboxOpen(false)}>
              <X size={28} />
            </button>
            {allImages.length > 1 && (
              <>
                <button className="absolute left-3 md:left-6 text-white/70 hover:text-white z-10 p-2" onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p - 1 + allImages.length) % allImages.length); }}>
                  <ChevronLeft size={32} />
                </button>
                <button className="absolute right-3 md:right-6 text-white/70 hover:text-white z-10 p-2" onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p + 1) % allImages.length); }}>
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            <img
              src={currentImg}
              alt={product.name}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {allImages.length > 1 && (
              <div className="absolute bottom-6 flex gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${selectedImage === i ? "bg-white scale-125" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-display font-medium text-foreground mb-2.5 leading-tight tracking-tight line-clamp-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < Math.floor(product.rating || 0) ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-border"} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.review_count || 0} Reviews)</span>
          </div>

          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/60">
            <span className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground tracking-tight tabular-nums">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-sm sm:text-base text-muted-foreground line-through tabular-nums">{formatPrice(product.original_price)}</span>
                <span className="chip-luxe">
                  {Math.round((1 - product.price / product.original_price) * 100)}% off
                </span>
              </>
            )}
          </div>

          {(product.short_description || product.description) && (
            <div className="text-sm text-muted-foreground mb-5 leading-relaxed prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.short_description || product.description || "" }} />
          )}

          {allowCustomImage && (
            <div className="mb-5 p-4 rounded-xl border border-border/50 bg-muted/20">
              <CustomImageUpload images={customImages} onChange={setCustomImages} maxImages={5} />
            </div>
          )}

          {allowCustomText && (
            <div className="mb-5 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <Type size={18} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Add Personalised Text</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, 12))}
                  placeholder="Enter Name For Personalisation"
                  className="w-full border border-border rounded-lg pl-3 pr-14 py-2.5 text-base bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  maxLength={12}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground tabular-nums">
                  {customText.length}/12
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 hover:bg-muted transition-colors">
                <Minus size={14} />
              </button>
              <span className="w-12 text-center text-sm font-semibold border-x border-border py-2.5">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5 hover:bg-muted transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <Button size="lg" variant="outline" className="flex-1 h-12 sm:h-[52px] text-xs sm:text-sm font-semibold rounded-full tracking-[0.14em] uppercase border-foreground/20 hover:border-[hsl(var(--gold)/0.6)] hover:bg-[hsl(var(--gold-light))] transition-all duration-500" onClick={handleAddToCart}>
              <ShoppingBag size={16} /> Add to Cart
            </Button>
            <button
              className="flex-1 h-12 sm:h-[52px] text-xs sm:text-sm font-semibold rounded-full tracking-[0.14em] uppercase text-primary-foreground transition-all duration-500 ease-luxe hover:shadow-luxe active:scale-[0.98] relative overflow-hidden"
              style={{ background: "var(--gradient-luxe)" }}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-12 sm:h-[52px] rounded-xl bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-semibold text-sm transition-colors mb-3">
              <MessageCircle size={18} /> Order On WhatsApp
            </a>
          )}

          {orderPhone && (
            <a href={`tel:${orderPhone}`} className="flex items-center justify-center gap-2 w-full h-12 sm:h-[52px] rounded-xl bg-[hsl(240,60%,35%)] hover:bg-[hsl(240,60%,30%)] text-white font-semibold text-sm transition-colors mb-5">
              <Phone size={18} /> Call For Order
            </a>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">Share Now :</span>
              <div className="flex items-center gap-2.5 mt-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1877F2] text-white shadow-sm hover:scale-110 hover:shadow-md transition-all"
                >
                  <Facebook size={18} fill="currentColor" strokeWidth={0} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X (Twitter)"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#000000] text-white shadow-sm hover:scale-110 hover:shadow-md transition-all"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-sm hover:scale-110 hover:shadow-md transition-all"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
                <button
                  onClick={handleCopyLink}
                  aria-label="Copy link"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-foreground border border-border/60 shadow-sm hover:scale-110 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                >
                  {copied ? <Check size={16} /> : <Link2 size={16} />}
                </button>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all" aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* About the product Section - FNP style */}
      <div className="mt-8 sm:mt-12 md:mt-14">
        <div className="mb-5 sm:mb-6">
          <span className="eyebrow mb-2">Details</span>
          <h2 className="display-heading text-foreground mt-1.5" style={{ fontSize: "clamp(1.25rem, 2.4vw + 0.5rem, 2rem)" }}>About the product</h2>
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 mb-5 sm:mb-6">
          {[
            { key: "description" as const, label: "Description" },
            { key: "instructions" as const, label: "Instructions" },
            { key: "delivery" as const, label: "Delivery Info" },
            { key: "reviews" as const, label: `Reviews (${product.review_count || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold border transition-all ${
                activeTab === tab.key
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "description" && (
            <div>
              {product.description ? (
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-sm text-muted-foreground">No description available.</p>
              )}
              {(() => {
                const specs = product.specifications as Array<{ item: string; value: string }> | null;
                if (!specs || specs.length === 0) return null;
                return (
                  <div className="mt-5">
                    <p className="text-sm sm:text-base font-semibold text-foreground mb-2">Product Details:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-foreground">
                      {specs.map((spec, i) => (
                        <li key={i}><span className="font-medium">{spec.item}:</span> {spec.value}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "instructions" && (
            <div className="text-sm sm:text-base text-foreground space-y-3">
              {(product as any).instructions ? (
                <div
                  className="rich-text-content text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: (product as any).instructions }}
                />
              ) : (
                <>
                  <p className="font-semibold">Care Instructions:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li>Keep flowers away from direct sunlight, heat, and drafts.</li>
                    <li>Trim stems at an angle every 2 days for longer freshness.</li>
                    <li>Change the water daily and keep the vase clean.</li>
                    <li>Remove any wilted petals or leaves to maintain bouquet beauty.</li>
                    <li>For cakes & food items, refrigerate immediately and consume within recommended time.</li>
                    <li>Handle personalized & fragile gifts with care while unboxing.</li>
                  </ul>
                </>
              )}
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="text-sm sm:text-base text-foreground space-y-3">
              {(product as any).delivery_info ? (
                <div
                  className="rich-text-content text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: (product as any).delivery_info }}
                />
              ) : (
                <>
                  <p className="font-semibold">Delivery Information:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    {product.delivery_time && (
                      <li><span className="font-medium text-foreground">Estimated Delivery:</span> {product.delivery_time}</li>
                    )}
                    <li>Same Day Delivery available within Dhaka City (Order before 6 PM).</li>
                    <li>Next Day Delivery available across Bangladesh via Steadfast, Pathao & other couriers.</li>
                    <li>Free delivery on eligible time slots and selected areas.</li>
                    <li>Delivery charges may vary based on location and selected delivery speed.</li>
                    <li>For urgent or midnight delivery, please contact our support team.</li>
                  </ul>
                </>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <ReviewSection productId={product.id} />
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8 sm:mt-12 md:mt-14">
          <div className="mb-5">
            <span className="eyebrow mb-2">More to Love</span>
            <h2 className="display-heading text-foreground mt-1.5" style={{ fontSize: "clamp(1.25rem, 2.4vw + 0.5rem, 2rem)" }}>You May Also Like</h2>
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
            {related.map((p: any, i: number) => (
              <div key={p.id} className="min-w-[44vw] w-[44vw] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] lg:min-w-[220px] lg:w-[220px] flex-shrink-0 snap-start">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;
