import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const EpsCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<"success" | "fail" | "cancel" | null>(null);

  const status = searchParams.get("status");
  const orderNumber = searchParams.get("order");
  const txn = searchParams.get("txn");

  useEffect(() => {
    const verify = async () => {
      if (status === "cancel") {
        setResult("cancel");
        setVerifying(false);
        return;
      }

      if (status === "success" && txn) {
        try {
          const { data, error } = await supabase.functions.invoke("eps-payment", {
            body: { action: "verify", merchantTransactionId: txn },
          });

          if (!error && data?.Status === "Success") {
            clearCart();
            setResult("success");
          } else {
            setResult("fail");
          }
        } catch {
          setResult("fail");
        }
      } else {
        setResult("fail");
      }
      setVerifying(false);
    };

    verify();
  }, [status, txn]);

  if (verifying) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-primary" size={48} />
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center pb-24">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {result === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your payment has been confirmed via EPS. Order: <strong>{orderNumber}</strong>
            </p>
            <Button onClick={() => navigate(`/order-success/${orderNumber}`)} className="rounded-full">
              View Order Details
            </Button>
          </>
        )}

        {result === "fail" && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Payment Failed</h1>
            <p className="text-muted-foreground">
              Your payment could not be processed. Please try again or choose a different payment method.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/checkout")} className="rounded-full">
                Back to Checkout
              </Button>
              <Button onClick={() => navigate("/shop")} className="rounded-full">
                Continue Shopping
              </Button>
            </div>
          </>
        )}

        {result === "cancel" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle size={40} className="text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              You cancelled the payment. Your order has not been charged.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/checkout")} className="rounded-full">
                Back to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default EpsCallback;
