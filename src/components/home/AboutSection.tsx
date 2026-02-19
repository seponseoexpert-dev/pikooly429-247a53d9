import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";
import medal1 from "@/assets/medal-1.png";
import medal2 from "@/assets/medal-2.png";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [expanded, setExpanded] = useState(false);

  return (
    <section ref={ref} className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="About PikoolyFlora">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-3 md:mb-4">
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

        {/* Medals */}
        <div className="flex items-center justify-center gap-4 mt-3 sm:mt-4">
          <img src={medal1} alt="PikoolyFlora Badge" className="h-12 sm:h-14 md:h-16 w-auto" />
          <img src={medal2} alt="PikoolyFlora Badge" className="h-12 sm:h-14 md:h-16 w-auto" />
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
