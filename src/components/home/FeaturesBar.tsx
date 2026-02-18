import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";
import { Truck, Shield, Clock, Gift } from "lucide-react";

const features = [
  { icon: Truck, title: "Same Day Delivery", desc: "Free delivery in Dhaka" },
  { icon: Shield, title: "Freshness Guaranteed", desc: "100% fresh or money back" },
  { icon: Clock, title: "24/7 Support", desc: "Always here to help you" },
  { icon: Gift, title: "Gift Wrapping", desc: "Beautiful packaging included" },
];

const FeaturesBar = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-8 md:py-12 bg-primary/5 border-y border-primary/10">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 md:justify-center"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBar;