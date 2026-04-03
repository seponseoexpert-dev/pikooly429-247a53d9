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
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 section-container" aria-label="About PikoolyFlora" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="max-w-3xl mx-auto border border-border/50 rounded-xl p-6 sm:p-8 md:p-10 bg-card" style={{ contain: "content" }}>
        <h2 className="section-heading font-display font-semibold text-foreground mb-4 text-center">
          {title}
        </h2>
        <div className="text-xs sm:text-sm md:text-[15px] text-muted-foreground leading-relaxed rich-text-content">
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

        <div className="flex items-center justify-center gap-4 mt-6">
          <img src={medal1} alt="PikoolyFlora Badge" width="140" height="48" className="w-[130px] h-[44px] sm:w-[150px] sm:h-[52px] md:w-[170px] md:h-[58px] object-contain" loading="lazy" decoding="async" />
          <img src={medal2} alt="PikoolyFlora Badge" width="140" height="48" className="w-[130px] h-[44px] sm:w-[150px] sm:h-[52px] md:w-[170px] md:h-[58px] object-contain" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
