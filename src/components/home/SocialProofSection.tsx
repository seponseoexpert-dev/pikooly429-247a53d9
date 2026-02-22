import { Star, Users } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const SocialProofSection = () => {
  const { settings } = useSiteSettings();

  const rating = settings?.google_rating || "4.8";
  const reviewCount = settings?.google_review_count || "0";
  const reviewLink = settings?.google_review_link || "";

  const formattedCount = Number(reviewCount).toLocaleString("en-IN");

  const content = (
    <div className="section-container py-4 sm:py-6">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl lg:rounded-3xl px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
        <div className="flex items-center gap-2.5">
          <Star className="h-6 w-6 sm:h-7 sm:w-7 fill-amber-400 text-amber-400" />
          <span className="text-lg sm:text-xl font-display font-bold text-foreground">
            Rated {rating}/5
          </span>
        </div>
        <div className="hidden sm:block w-px h-8 bg-border" />
        <div className="flex items-center gap-2.5">
          <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <span className="text-lg sm:text-xl font-display font-bold text-foreground">
            {formattedCount}+ Happy Customers
          </span>
        </div>
      </div>
    </div>
  );

  if (reviewLink) {
    return (
      <a href={reviewLink} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
};

export default SocialProofSection;
