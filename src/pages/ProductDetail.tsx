import { useParams, Link } from "react-router-dom";
import { products } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Star, ArrowLeft } from "lucide-react";
import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === id);
  if (!product) {
    return (
      <main className="section-container py-20 text-center">
        <p className="text-lg text-muted-foreground">Product not found.</p>
        <Link to="/shop" className="text-primary mt-4 inline-block">← Back to shop</Link>
      </main>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <main className="section-container py-6 md:py-10 pb-24 md:pb-10">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {product.badge && (
            <span className="inline-block w-fit px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full mb-3">
              {product.badge}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {product.name}
          </h1>
          {product.rating && (
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating!) ? "fill-gold text-gold" : "text-border"} />
              ))}
              <span className="text-sm text-muted-foreground ml-1">({product.rating})</span>
            </div>
          )}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">৳{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            A beautiful handcrafted arrangement perfect for any occasion. Fresh flowers sourced daily to ensure the highest quality and longest vase life. Order before 3 PM for same-day delivery in Dhaka.
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-3 border border-border rounded-full px-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:text-primary transition-colors"><Minus size={16} /></button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2 hover:text-primary transition-colors"><Plus size={16} /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 rounded-full h-13 text-base font-semibold"
              onClick={() => { for (let i = 0; i < qty; i++) addItem(product); }}
            >
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-13 px-5">
              <Heart size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-display font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;