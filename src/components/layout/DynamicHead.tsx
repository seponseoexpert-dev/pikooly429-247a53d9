import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DynamicHead = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Update favicon
    const faviconUrl = settings.company_favicon;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }

    // Update site title
    const siteTitle = settings.site_title;
    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [settings]);

  return null;
};

export default DynamicHead;
