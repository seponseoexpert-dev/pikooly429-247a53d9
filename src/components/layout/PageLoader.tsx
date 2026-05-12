import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PageLoader = () => {
  const { settings } = useSiteSettings();
  const brandName = settings.store_name || settings.site_title || "Pikooly";
  const letter = (brandName.trim()[0] || "P").toUpperCase();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <motion.div
        className="relative w-16 h-16 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
        <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
        <span
          className="relative text-primary font-bold text-2xl leading-none"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
        >
          {letter}
        </span>
      </motion.div>
    </div>
  );
};

export default PageLoader;
