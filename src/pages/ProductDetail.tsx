import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, Phone, MessageCircle, Type } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState<"specification" | "description" | "reviews">("specification");
  const [customImages, setCustomImages] = useState<File[]>([]);
  const [customText, setCustomText] = useState("");

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
    placeholderData: (prev) => prev,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
    placeholderData: (prev) => prev,
  });

  // Check if this product's category allows custom image uploads
  const allowCustomImage = !!(product?.categories as any)?.allow_custom_image;
  const allowCustomText = !!(product?.categories as any)?.allow_custom_text;

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
        {/* Image Gallery */}
        <div>
          <div className="aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-muted/10 border border-border/30 shadow-sm mb-3">
            <img src={currentImg} alt={product.name} className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                    selectedImage === i ? "border-primary shadow-sm" : "border-border/40 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-display font-bold text-foreground mb-2 leading-snug line-clamp-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < Math.floor(product.rating || 0) ? "fill-amber-400 text-amber-400" : "text-border"} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.review_count || 0} Reviews)</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-sm sm:text-base text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                <span className="text-xs sm:text-sm text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
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
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value.slice(0, 50))}
                placeholder="Enter Name for Personalization"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                maxLength={50}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">{customText.length}/50 characters</p>
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
            <Button size="lg" className="flex-1 h-12 sm:h-[52px] text-sm font-semibold rounded-xl" onClick={handleAddToCart}>
              <ShoppingBag size={18} /> ADD TO CART
            </Button>
            <Button size="lg" className="flex-1 h-12 sm:h-[52px] text-sm font-semibold rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleBuyNow}>
              BUY NOW
            </Button>
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
              <div className="flex items-center gap-2 mt-2">
                {[
                  { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
                  { label: "Twitter", href: `https://twitter.com/intent/tweet?url=${shareUrl}` },
                  { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all text-xs font-bold" aria-label={`Share on ${s.label}`}>
                    {s.label[0]}
                  </a>
                ))}
              </div>
            </div>
            <button className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all" aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabbed Section */}
      <div className="mt-6 sm:mt-10 md:mt-12 border border-border/40 rounded-xl bg-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-border">
          {[
            { key: "specification" as const, label: "Specification" },
            { key: "description" as const, label: "Description" },
            { key: "reviews" as const, label: `Reviews (${product.review_count || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 text-[11px] sm:text-xs md:text-sm font-medium text-center transition-all border-b-2 ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === "specification" && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Specification</h3>
              <div className="w-12 h-0.5 bg-primary mb-4" />
              {(() => {
                const specs = product.specifications as Array<{ item: string; value: string }> | null;
                if (!specs || specs.length === 0) {
                  return <p className="text-sm text-muted-foreground">No specifications available.</p>;
                }
                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 font-semibold text-foreground w-1/2">Item</th>
                        <th className="text-left py-3 font-semibold text-foreground">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specs.map((spec, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="py-3 text-foreground">{spec.item}</td>
                          <td className="py-3 text-muted-foreground">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {activeTab === "description" && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Description</h3>
              <div className="w-12 h-0.5 bg-primary mb-4" />
              {product.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-sm text-muted-foreground">No description available.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <ReviewSection productId={product.id} />
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-6 sm:mt-10 md:mt-12">
          <h2 className="text-base sm:text-lg md:text-xl font-display font-bold mb-3 sm:mb-4">You May Also Like</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
            {related.map((p: any, i: number) => (
              <div key={p.id} className="min-w-[140px] w-[140px] sm:min-w-[170px] sm:w-[170px] md:min-w-[200px] md:w-[200px] lg:min-w-[220px] lg:w-[220px] flex-shrink-0 snap-start">
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
