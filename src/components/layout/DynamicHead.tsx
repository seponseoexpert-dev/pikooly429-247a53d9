import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DynamicHead = () => {
  const { settings } = useSiteSettings();
  const injectedRef = useRef<{ ga?: boolean; pixel?: boolean; gtm?: boolean }>({});

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

  // Google Analytics (gtag.js)
  useEffect(() => {
    const gaId = settings.google_analytics_id;
    if (!gaId || injectedRef.current.ga) return;
    injectedRef.current.ga = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inline);
  }, [settings.google_analytics_id]);

  // Facebook Pixel
  useEffect(() => {
    const pixelId = settings.facebook_pixel_id;
    if (!pixelId || injectedRef.current.pixel) return;
    injectedRef.current.pixel = true;

    const inline = document.createElement("script");
    inline.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(inline);

    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);
  }, [settings.facebook_pixel_id]);

  // Google Tag Manager
  useEffect(() => {
    const gtmId = settings.google_tag_manager_id;
    if (!gtmId || injectedRef.current.gtm) return;
    injectedRef.current.gtm = true;

    const inline = document.createElement("script");
    inline.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(inline);
  }, [settings.google_tag_manager_id]);

  return null;
};

export default DynamicHead;
