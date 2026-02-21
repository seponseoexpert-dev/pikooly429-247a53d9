import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import medal1 from "@/assets/medal-1.png";
import medal2 from "@/assets/medal-2.png";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [expanded, setExpanded] = useState(false);
  const { settings } = useSiteSettings();

  const title = settings.about_title || "PikoolyFlora: Online Flower Shop in Bangladesh";
  const shortText = settings.about_short_text || "Welcome to PikoolyFlora-Online website. This is the best place for fresh flowers and beauti";
  const fullText = settings.about_full_text || "ful gifts in Bangladesh. We believe every occasion deserves something special, and we're here to make gifting effortless and joyful.\n\nWhether it's a birthday celebration, anniversary surprise, or a simple \"I love you\" gesture, our handcrafted bouquets and curated gift collections are designed to bring smiles. With same-day delivery across Dhaka, your love reaches them exactly when it matters.";

  return (
    <section ref={ref} className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="About PikoolyFlora">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto border border-border rounded-xl p-5 sm:p-6 md:p-8 lg:p-10 bg-card"
      >
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-3 md:mb-4 text-center">
          {title}
        </h2>
        <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed rich-text-content">
          <div dangerouslySetInnerHTML={{ __html: shortText }} />
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-primary font-medium text-xs sm:text-sm hover:underline inline ml-1"
            >
              Read more
            </button>
          )}
          {expanded && (
            <>
              <div dangerouslySetInnerHTML={{ __html: fullText }} />
              <button
                onClick={() => setExpanded(false)}
                className="text-primary font-medium text-xs sm:text-sm mt-2 hover:underline block"
              >
                Show less
              </button>
            </>
          )}
        </div>

        {/* Medals */}
        <div className="flex items-center justify-center gap-4 mt-4 sm:mt-5">
          <img src={medal1} alt="PikoolyFlora Badge" className="h-12 sm:h-14 md:h-16 w-auto" />
          <img src={medal2} alt="PikoolyFlora Badge" className="h-12 sm:h-14 md:h-16 w-auto" />
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
