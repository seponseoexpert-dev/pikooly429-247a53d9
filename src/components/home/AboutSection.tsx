import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [expanded, setExpanded] = useState(false);

  return (
    <section ref={ref} className="py-8 sm:py-10 md:py-12 lg:py-14 section-container" aria-label="About PikoolyFlora">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 md:mb-4">
          PikoolyFlora: Online Flower Shop in Bangladesh
        </h2>
        <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed space-y-2 sm:space-y-3">
          <p>
            Welcome to PikoolyFlora-Online website. This is the best place for fresh flowers and beauti
            {!expanded && "..."}
          </p>
          {expanded && (
            <>
              <p>
                ful gifts in Bangladesh. We believe every occasion deserves something special,
                and we're here to make gifting effortless and joyful.
              </p>
              <p>
                Whether it's a birthday celebration, anniversary surprise, or a simple "I love you" gesture,
                our handcrafted bouquets and curated gift collections are designed to bring smiles.
                With same-day delivery across Dhaka, your love reaches them exactly when it matters.
              </p>
            </>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary font-medium text-xs sm:text-sm mt-2 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </motion.div>
    </section>
  );
};

export default AboutSection;
