import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, Phone, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import ReviewSection from "@/components/product/ReviewSection";
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

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      let { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", id!)
        .maybeSingle();
      if (!data) {
        ({ data, error } = await supabase
          .from("products")
          .select("*, categories(name, slug)")
          .eq("id", id!)
          .maybeSingle());
      }
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
  });

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!product) return;
    const siteName = settings.site_title || "Store";
    const seoTitle = (product as any).seo_title || `${product.name} - ${siteName}`;
    document.title = seoTitle;

    const seoDesc = (product as any).seo_description || product.description || "";
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seoDesc.slice(0, 160);

    return () => {
      document.title = siteName;
    };
  }, [product, settings]);

  if (isLoading) {
    return (
      <main className="section-container py-20 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
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
    name: product.name,
    price: product.price,
    originalPrice: product.original_price ?? undefined,
    image: mainImg,
    category: product.categories?.slug || "",
    inStock: product.stock > 0,
  };

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(cartProduct);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addItem(cartProduct);
    navigate("/checkout");
  };

  const whatsappUrl = `https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent(`Hi! I want to order: ${product.name} (${formatPrice(product.price)}) x ${qty}`)}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
            <img src={currentImg} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === i ? "border-primary" : "border-border/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            {product.name}
          </h1>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{formatPrice(product.price)}</span>
            <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < Math.floor(product.rating || 0) ? "fill-amber-400 text-amber-400" : "text-border"} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.review_count || 0} Reviews)</span>
          </div>

          {product.original_price && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
              <span className="text-sm text-primary font-medium">
                {Math.round((1 - product.price / product.original_price) * 100)}% off
              </span>
            </div>
          )}

          {product.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-muted transition-colors rounded-l-lg">
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-medium border-x border-border py-2">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-muted transition-colors rounded-r-lg">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Add to Cart & Buy Now */}
          <div className="flex gap-3 mb-3">
            <Button size="lg" className="flex-1 h-12 text-sm font-semibold rounded-lg" onClick={handleAddToCart}>
              <ShoppingBag size={18} /> ADD TO CART
            </Button>
            <Button size="lg" className="flex-1 h-12 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white" onClick={handleBuyNow}>
              BUY NOW
            </Button>
          </div>

          {/* WhatsApp Order */}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-semibold text-sm transition-colors mb-3">
            <MessageCircle size={18} /> Order On WhatsApp
          </a>

          {/* Call For Order */}
          <a href="tel:+8801XXXXXXXXX" className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-[hsl(240,60%,35%)] hover:bg-[hsl(240,60%,30%)] text-white font-semibold text-sm transition-colors mb-5">
            <Phone size={18} /> Call For Order
          </a>

          {/* Share */}
          <div>
            <span className="text-sm font-medium text-foreground">Share Now :</span>
            <div className="flex items-center gap-2 mt-2">
              {[
                { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
                { label: "Twitter", href: `https://twitter.com/intent/tweet?url=${shareUrl}` },
                { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors text-xs font-bold" aria-label={`Share on ${s.label}`}>
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Section */}
      <div className="mt-10 sm:mt-14 border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
          {[
            { key: "specification" as const, label: "Specification" },
            { key: "description" as const, label: "Description" },
            { key: "reviews" as const, label: `Reviews (${product.review_count || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
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
                <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
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
        <section className="mt-10 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-display font-bold mb-4 sm:mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 md:gap-5">
            {related.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;
