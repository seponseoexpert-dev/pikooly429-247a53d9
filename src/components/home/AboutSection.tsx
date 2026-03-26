import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import medal1 from "@/assets/medal-1.png";
import medal2 from "@/assets/medal-2.png";

const AboutSection = () => {
  const [expanded, setExpanded] = useState(false);
  const { settings } = useSiteSettings();

  const title = settings.about_title || "PikoolyFlora: Online Flower Shop in Bangladesh";
  const shortText = settings.about_short_text || "Welcome to PikoolyFlora-Online website. This is the best place for fresh flowers and beauti";
  const fullText = settings.about_full_text || "ful gifts in Bangladesh. We believe every occasion deserves something special, and we're here to make gifting effortless and joyful.\n\nWhether it's a birthday celebration, anniversary surprise, or a simple \"I love you\" gesture, our handcrafted bouquets and curated gift collections are designed to bring smiles. With same-day delivery across Dhaka, your love reaches them exactly when it matters.";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="About PikoolyFlora" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="max-w-4xl mx-auto border border-border rounded-xl p-5 sm:p-6 md:p-8 lg:p-10 bg-card" style={{ contain: "content" }}>
        <h2 className="text-[16px] leading-[24px] md:text-[24px] md:leading-[36px] font-display font-semibold text-foreground mb-3 md:mb-4 text-center">
          {title}
        </h2>
        <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed rich-text-content">
          <div dangerouslySetInnerHTML={{ __html: shortText }} />
          {expanded && <div dangerouslySetInnerHTML={{ __html: fullText }} />}
        </div>
        <div className="text-center mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary font-medium text-xs sm:text-sm hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>

        {/* Medals */}
        <div className="flex items-center justify-center gap-4 mt-4 sm:mt-5">
          <img src={medal1} alt="PikoolyFlora Badge" width="140" height="48" className="w-[140px] h-[48px] sm:w-[163px] sm:h-[56px] md:w-[187px] md:h-[64px] object-contain" loading="lazy" decoding="async" />
          <img src={medal2} alt="PikoolyFlora Badge" width="140" height="48" className="w-[140px] h-[48px] sm:w-[163px] sm:h-[56px] md:w-[187px] md:h-[64px] object-contain" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
