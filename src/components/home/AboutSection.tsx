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
    <section className="py-8 sm:py-10 md:py-14 lg:py-16 section-container" aria-label="About PikoolyFlora" style={{ contain: "layout style", minHeight: "180px" }}>
      <div className="mb-4 sm:mb-5">
        <span className="gold-rule mb-2.5">About Us</span>
        <h2 className="display-heading text-foreground mt-2" style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}>
          {title}
        </h2>
      </div>
      <div
        className={`text-[13px] sm:text-sm md:text-[15px] lg:text-base text-muted-foreground leading-relaxed sm:leading-[1.8] rich-text-content ${!expanded ? "line-clamp-5" : ""}`}
        dangerouslySetInnerHTML={{ __html: fullContent }}
      />
      <div className="text-center mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary font-semibold text-sm sm:text-base hover:underline underline-offset-4"
        >
          {expanded ? "Show Less" : "Read More"}
        </button>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <img src={medal1} alt="PikoolyFlora Badge" width="140" height="48" className="w-[120px] h-[40px] sm:w-[140px] sm:h-[48px] md:w-[160px] md:h-[54px] object-contain" loading="lazy" decoding="async" />
        <img src={medal2} alt="PikoolyFlora Badge" width="140" height="48" className="w-[120px] h-[40px] sm:w-[140px] sm:h-[48px] md:w-[160px] md:h-[54px] object-contain" loading="lazy" decoding="async" />
      </div>
    </section>
  );
};

export default AboutSection;
