import { useParams, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, ArrowLeft } from "lucide-react";
import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      // Try slug first, then id
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
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

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
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Product not found.</p>
        <Link to="/shop" className="text-primary mt-4 inline-block text-xs sm:text-sm">← Back to shop</Link>
      </main>
    );
  }

  const imgSrc = product.image_url || "/placeholder.svg";
  const cartProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price ?? undefined,
    image: imgSrc,
    category: product.categories?.slug || "",
    inStock: product.stock > 0,
  };

  return (
    <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
      <Link to="/shop" className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors mb-4 sm:mb-6">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2 sm:mb-3">
            {product.name}
          </h1>
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1 mb-3 sm:mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={`sm:w-4 sm:h-4 ${i < Math.floor(product.rating!) ? "fill-gold text-gold" : "text-border"}`} />
              ))}
              <span className="text-xs sm:text-sm text-muted-foreground ml-1">({product.rating})</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-primary">৳{product.price.toLocaleString()}</span>
            {product.original_price && (
              <span className="text-sm sm:text-lg text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
            )}
          </div>

          {product.description && (
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-3 border border-border rounded-full px-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1.5 sm:p-2 hover:text-primary transition-colors"><Minus size={14} /></button>
              <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-1.5 sm:p-2 hover:text-primary transition-colors"><Plus size={14} /></button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button
              size="lg"
              className="flex-1 rounded-full h-11 sm:h-13 text-sm sm:text-base font-semibold"
              onClick={() => { for (let i = 0; i < qty; i++) addItem(cartProduct); }}
            >
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-11 sm:h-13 px-4 sm:px-5">
              <Heart size={18} />
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-display font-bold mb-4 sm:mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-5">
            {related.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;
