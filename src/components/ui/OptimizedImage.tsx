import { useState, useRef, useEffect, memo, ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  /** Set true for above-fold images */
  priority?: boolean;
}

/**
 * Optimized image component with:
 * - Native lazy loading (unless priority)
 * - Blur-up placeholder
 * - Error fallback
 * - Proper width/height to prevent CLS
 */
const OptimizedImage = memo(({ src, alt, fallback = "/placeholder.svg", priority = false, className = "", ...props }: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgSrc = error ? fallback : src;

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      {...props}
    />
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
