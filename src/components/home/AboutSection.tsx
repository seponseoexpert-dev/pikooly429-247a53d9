import { useState } from "react";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import medal1 from "@/assets/medal-1.png";
import medal2 from "@/assets/medal-2.png";

const AboutSection = () => {
  const [expanded, setExpanded] = useState(false);
  const { settings } = useSiteSettings();

  const title = settings.about_title || "PikoolyFlora: Online Flower Shop in Bangladesh";
  const fullContent = (settings.about_short_text || "") + (settings.about_full_text || "");

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container" aria-label="About PikoolyFlora" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="max-w-3xl mx-auto border border-border/50 rounded-xl p-4 sm:p-6 md:p-8 bg-card" style={{ contain: "content" }}>
        <h2 className="section-heading font-display font-semibold text-foreground mb-4 text-center">
          {title}
        </h2>
        <div
          className={`text-xs sm:text-sm md:text-[15px] text-muted-foreground leading-relaxed rich-text-content ${!expanded ? "line-clamp-5" : ""}`}
          dangerouslySetInnerHTML={{ __html: fullContent }}
        />
        <div className="text-center mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary font-medium text-xs sm:text-sm hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <img src={medal1} alt="PikoolyFlora Badge" width="140" height="48" className="w-[120px] h-[40px] sm:w-[140px] sm:h-[48px] md:w-[160px] md:h-[54px] object-contain" loading="lazy" decoding="async" />
          <img src={medal2} alt="PikoolyFlora Badge" width="140" height="48" className="w-[120px] h-[40px] sm:w-[140px] sm:h-[48px] md:w-[160px] md:h-[54px] object-contain" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
