import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 md:py-16 bg-muted/30" aria-label="About Pikooly">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            Pikooly: Online Flower Shop in Bangladesh
          </h2>
          <div className="prose prose-sm md:prose-base text-muted-foreground max-w-none space-y-4">
            <p>
              Welcome to <strong className="text-foreground">Pikooly</strong> — your trusted online destination for fresh flowers,
              delicious cakes, and thoughtful gifts in Bangladesh. We believe every occasion deserves something special,
              and we're here to make gifting effortless and joyful.
            </p>
            <p>
              Whether it's a birthday celebration, anniversary surprise, or a simple "I love you" gesture,
              our handcrafted bouquets and curated gift collections are designed to bring smiles and create lasting memories.
              With same-day delivery across Dhaka, your love reaches them exactly when it matters.
            </p>
            <p>
              From premium roses and exotic lilies to custom chocolate cakes and luxury gift hampers —
              <strong className="text-foreground"> Pikooly is not just a gift. It's sharing of Love.</strong> 🌸
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;