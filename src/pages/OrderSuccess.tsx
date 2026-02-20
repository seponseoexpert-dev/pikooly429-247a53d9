import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Home, Phone, Mail, MapPin, PartyPopper, CircleCheckBig } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const { settings } = useSiteSettings();

  const storePhone = settings?.store_phone || "";
  const storeEmail = settings?.store_email || "";
  const whatsapp = settings?.whatsapp_number || "";

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-32">
      <div className="container mx-auto px-4 max-w-xl">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CircleCheckBig size={52} className="text-green-600" strokeWidth={1.8} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper size={28} className="text-amber-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Thank You Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Your order has been placed successfully and is being processed.
          </p>
        </motion.div>

        {/* Order Number Card */}
        {orderNumber && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-2xl p-5 mb-6 text-center shadow-sm"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">
              Order Number
            </p>
            <p className="text-lg md:text-xl font-mono font-bold text-primary tracking-wide">
              {orderNumber}
            </p>
          </motion.div>
        )}

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "We'll confirm your order via WhatsApp or phone call." },
              { step: "2", text: "Your gift will be prepared with care and love." },
              { step: "3", text: "We'll deliver it to the recipient on time!" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-muted/50 border border-border rounded-2xl p-5 mb-8"
        >
          <h3 className="text-sm font-semibold mb-3">Need Help?</h3>
          <div className="space-y-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone size={14} />
                <span>WhatsApp: {whatsapp}</span>
              </a>
            )}
            {storePhone && (
              <a
                href={`tel:${storePhone}`}
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone size={14} />
                <span>Call: {storePhone}</span>
              </a>
            )}
            {storeEmail && (
              <a
                href={`mailto:${storeEmail}`}
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail size={14} />
                <span>{storeEmail}</span>
              </a>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/shop" className="flex-1 sm:flex-none">
            <Button variant="outline" className="rounded-full gap-2 w-full sm:w-auto px-6 h-11">
              <ShoppingBag size={16} /> Continue Shopping
            </Button>
          </Link>
          <Link to="/" className="flex-1 sm:flex-none">
            <Button className="rounded-full gap-2 w-full sm:w-auto px-6 h-11">
              <Home size={16} /> Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default OrderSuccess;
