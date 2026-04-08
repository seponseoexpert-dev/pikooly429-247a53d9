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
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 section-container" aria-label="About PikoolyFlora" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="max-w-3xl mx-auto border border-border/50 rounded-xl p-6 sm:p-8 md:p-10 bg-card" style={{ contain: "content" }}>
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

        <div className="flex items-center justify-center gap-4 mt-6">
          <img src={medal1} alt="PikoolyFlora Badge" width="140" height="48" className="w-[130px] h-[44px] sm:w-[150px] sm:h-[52px] md:w-[170px] md:h-[58px] object-contain" loading="lazy" decoding="async" />
          <img src={medal2} alt="PikoolyFlora Badge" width="140" height="48" className="w-[130px] h-[44px] sm:w-[150px] sm:h-[52px] md:w-[170px] md:h-[58px] object-contain" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
