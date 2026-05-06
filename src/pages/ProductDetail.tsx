import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { toast } from "sonner";
import { useCart, VariantSelection, buildVariantKey } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, Phone, MessageCircle, Type, X, ChevronLeft, ChevronRight, Facebook, Twitter, Link2, Check, Ruler, Palette, Zap } from "lucide-react";
import { parseDeliveryBadge } from "@/lib/deliveryBadge";
import DeliveryChecker from "@/components/product/DeliveryChecker";
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
  const { addItem, clearCart, updateQuantity } = useCart();
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
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

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

  // Recommended Add-on Products (managed in admin Cart Add-ons)
  const { data: addonProducts = [] } = useQuery({
    queryKey: ["product-detail-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_addons")
        .select("product_id, sort_order, products!inner(id, name, slug, price, original_price, image_url, is_active)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[])
        .map((r) => r.products)
        .filter((p: any) => p && p.is_active);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product sizes & colors variants
  const { data: sizes = [] } = useQuery({
    queryKey: ["product-sizes", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .eq("product_id", product!.id)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["product-colors", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .eq("product_id", product!.id)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  const selectedSize = sizes.find((s: any) => s.id === selectedSizeId);
  const selectedColor = colors.find((c: any) => c.id === selectedColorId);
  const sizeExtra = Number(selectedSize?.extra_price || 0);
  const effectivePrice = (product?.price || 0) + sizeExtra;
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

  const variantSuffixParts: string[] = [];
  if (selectedSize) variantSuffixParts.push(selectedSize.name);
  if (selectedColor) variantSuffixParts.push(selectedColor.name);
  const variantSuffix = variantSuffixParts.length ? ` — ${variantSuffixParts.join(" / ")}` : "";

  const cartProduct = {
    id: product.id,
    name: (customText.trim() ? `${product.name} (Personalized: ${customText.trim()})` : product.name) + variantSuffix,
    price: effectivePrice,
    originalPrice: product.original_price ?? undefined,
    image: mainImg,
    category: product.categories?.slug || "",
    categoryId: product.category_id || null,
    inStock: product.stock > 0,
    deliveryTime: (product as any).delivery_time ?? null,
    sameDayDistricts: (product as any).same_day_districts ?? null,
    nextDayDistricts: (product as any).next_day_districts ?? null,
  };

  const buildVariantPayload = (): VariantSelection | undefined => {
    if (!selectedSize && !selectedColor) return undefined;
    return {
      size: selectedSize ? { name: selectedSize.name, extraPrice: Number(selectedSize.extra_price || 0) } : undefined,
      color: selectedColor ? { name: selectedColor.name, hex: selectedColor.hex_code } : undefined,
    };
  };

  const validateVariants = () => {
    if (sizes.length > 0 && !selectedSizeId) {
      toast.error("Please select a size");
      return false;
    }
    if (colors.length > 0 && !selectedColorId) {
      toast.error("Please select a color");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateVariants()) return;
    const variant = buildVariantPayload();
    for (let i = 0; i < qty; i++) addItem(cartProduct, customImages.length ? customImages : undefined, false, variant);
  };

  const handleBuyNow = () => {
    if (!validateVariants()) return;
    if (product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    const variant = buildVariantPayload();
    // Quick checkout: replace cart with just this product at the selected qty
    clearCart();
    addItem(cartProduct, customImages.length ? customImages : undefined, true, variant);
    if (qty > 1) {
      const variantKey = buildVariantKey(variant);
      updateQuantity(product.id, qty, variantKey);
    }
    navigate("/checkout", { state: { fromBuyNow: true } });
  };

  const orderWhatsApp = settings.order_whatsapp_number || settings.whatsapp_number || "";
  const orderPhone = settings.order_phone_number || settings.store_phone || "";
  const whatsappUrl = orderWhatsApp ? `https://wa.me/${orderWhatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I want to order: ${product.name} (${formatPrice(product.price)}) x ${qty}`)}` : "";

  const handleAddAddon = (p: any) => {
    addItem(
      {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        originalPrice: p.original_price ?? undefined,
        image: p.image_url || "/placeholder.svg",
        category: "",
        categoryId: null,
        inStock: true,
      },
      undefined,
      true,
    );
    toast.success(`${p.name} added to cart`);
  };
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
            <span className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground tracking-tight tabular-nums">{formatPrice(effectivePrice)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-sm sm:text-base text-muted-foreground line-through tabular-nums">{formatPrice(product.original_price + sizeExtra)}</span>
                <span className="chip-luxe">
                  {Math.round((1 - product.price / product.original_price) * 100)}% off
                </span>
              </>
            )}
          </div>

          {/* Variants — clean "ADD SOMETHING EXTRA" style table */}
          {(sizes.length > 0 || colors.length > 0) && (
            <div className="mb-5 border-y border-border/70 py-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
                Add Something Extra
              </p>
              <div className="divide-y divide-border/50">
                {sizes.length > 0 && (
                  <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] items-center gap-3 py-2.5">
                    <label htmlFor="variant-size" className="text-sm font-serif text-foreground/90 flex items-center gap-1.5">
                      <Ruler size={14} className="text-primary/70" /> Size
                    </label>
                    <select
                      id="variant-size"
                      value={selectedSizeId || ""}
                      onChange={(e) => setSelectedSizeId(e.target.value || null)}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    >
                      <option value="">Select Size</option>
                      {sizes.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {Number(s.extra_price) > 0 ? ` (+${formatPrice(Number(s.extra_price))})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {colors.length > 0 && (
                  <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] items-center gap-3 py-2.5">
                    <label htmlFor="variant-color" className="text-sm font-serif text-foreground/90 flex items-center gap-1.5">
                      <Palette size={14} className="text-primary/70" /> Color
                    </label>
                    <div className="relative">
                      <select
                        id="variant-color"
                        value={selectedColorId || ""}
                        onChange={(e) => setSelectedColorId(e.target.value || null)}
                        className="w-full h-10 rounded-md border border-border bg-background pl-3 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition appearance-auto"
                        style={selectedColor ? { paddingLeft: "2rem" } : undefined}
                      >
                        <option value="">Select Color</option>
                        {colors.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {selectedColor && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: selectedColor.hex_code }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(() => {
            const sd = (product.short_description || "").replace(/<[^>]*>/g, "").trim();
            return sd ? (
              <div className="text-sm text-muted-foreground mb-5 leading-relaxed prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.short_description || "" }} />
            ) : null;
          })()}

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

          {/* Delivery availability checker */}
          <div className="mb-4">
            <DeliveryChecker
              productId={(product as any).id}
              categoryId={(product as any).category_id}
              product={{
                same_day_districts: (product as any).same_day_districts,
                next_day_districts: (product as any).next_day_districts,
                standard_delivery_days: (product as any).standard_delivery_days,
              }}
            />
          </div>

          {/* Primary actions: hidden on mobile (rendered as sticky bar below) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <button
                onClick={handleAddToCart}
                className="group relative h-12 sm:h-[54px] rounded-full bg-white border-2 border-primary/80 text-primary text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.45)] active:scale-[0.97] transition-all duration-300 ease-luxe overflow-hidden"
              >
                <ShoppingBag size={15} strokeWidth={2.2} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="btn-metal-shine group relative h-12 sm:h-[54px] rounded-full text-primary-foreground text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)] hover:shadow-[0_12px_28px_-6px_hsl(var(--primary)/0.65)] active:scale-[0.97] transition-all duration-300 ease-luxe overflow-hidden"
                style={{ background: "var(--gradient-luxe)" }}
              >
                <span aria-hidden className="metal-sheen pointer-events-none absolute inset-0" />
                <Zap size={14} strokeWidth={2.4} className="fill-current relative" />
                <span className="relative">Buy Now</span>
                <span className="relative font-bold tabular-nums normal-case tracking-normal">| {formatPrice(effectivePrice * qty)}</span>
              </button>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-2.5 w-full h-12 sm:h-[54px] rounded-full text-white font-semibold text-[13px] sm:text-sm tracking-wide shadow-[0_6px_18px_-6px_hsl(142_70%_40%/0.55)] hover:shadow-[0_10px_24px_-6px_hsl(142_70%_40%/0.7)] active:scale-[0.98] transition-all duration-300 ease-luxe mb-2.5 sm:mb-3 overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(142 72% 48%) 0%, hsl(142 70% 38%) 100%)" }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-luxe bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm">
                  <MessageCircle size={15} strokeWidth={2.4} />
                </span>
                <span className="relative">Order On WhatsApp</span>
              </a>
            )}

            {orderPhone && (
              <a
                href={`tel:${orderPhone}`}
                className="group relative flex items-center justify-center gap-2.5 w-full h-12 sm:h-[54px] rounded-full text-white font-semibold text-[13px] sm:text-sm tracking-wide shadow-[0_6px_18px_-6px_hsl(240_60%_30%/0.55)] hover:shadow-[0_10px_24px_-6px_hsl(240_60%_30%/0.7)] active:scale-[0.98] transition-all duration-300 ease-luxe mb-5 overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(240 60% 38%) 0%, hsl(240 65% 24%) 100%)" }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-luxe bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm">
                  <Phone size={14} strokeWidth={2.4} className="fill-current" />
                </span>
                <span className="relative">Call For Order</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* Recommended Addon Products */}
      {addonProducts.length > 0 && (
        <section className="mt-8 sm:mt-12 md:mt-14">
          <div className="mb-4 sm:mb-5">
            <span className="eyebrow mb-2">Pair It Up</span>
            <h2 className="display-heading text-foreground mt-1.5" style={{ fontSize: "clamp(1.25rem, 2.4vw + 0.5rem, 2rem)" }}>
              Recommended Addon Products
            </h2>
          </div>
          <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            {addonProducts.slice(0, 12).map((p: any) => (
              <div
                key={p.id}
                className="snap-start shrink-0 basis-[30%] sm:basis-[22%] lg:basis-[15.5%] bg-white rounded-2xl border border-border/60 overflow-hidden flex flex-col"
              >
                <Link to={`/product/${p.slug || p.id}`} className="block aspect-square bg-muted/20">
                  <img
                    src={p.image_url || "/placeholder.svg"}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 flex-1">
                  <p className="text-xs sm:text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5em]">{p.name}</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatPrice(Number(p.price))}</p>
                  <button
                    onClick={() => handleAddAddon(p)}
                    className="mt-auto h-9 rounded-md border-2 border-primary text-primary text-[12px] font-bold tracking-wider uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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


      {/* Mobile sticky action bar — Add to Cart + Buy Now only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToCart}
            className="h-11 rounded-md bg-white border-2 border-primary text-primary text-[11px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <ShoppingBag size={14} strokeWidth={2.2} />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="h-11 rounded-md text-primary-foreground text-[11px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
            style={{ background: "var(--gradient-luxe)" }}
          >
            <Zap size={13} strokeWidth={2.4} className="fill-current" />
            Buy Now | <span className="tabular-nums normal-case tracking-normal">{formatPrice(effectivePrice * qty)}</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
