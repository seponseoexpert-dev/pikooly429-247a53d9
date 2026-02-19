import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag } from "lucide-react";

const OrderSuccess = () => {
  const { orderNumber } = useParams();

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 text-center py-16 max-w-lg">
        <CheckCircle size={72} className="mx-auto mb-6 text-green-500" />
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-3">Order Successful! 🎉</h1>
        <p className="text-muted-foreground mb-2">Your order has been placed successfully.</p>
        {orderNumber && (
          <p className="text-sm bg-muted inline-block px-4 py-2 rounded-full font-mono font-semibold mb-8">
            Order Number: {orderNumber}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Link to="/shop">
            <Button variant="outline" className="rounded-full gap-2">
              <ShoppingBag size={16} /> Continue Shopping
            </Button>
          </Link>
          <Link to="/">
            <Button className="rounded-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccess;
