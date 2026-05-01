import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Smoothly cross-fades + slides the page content whenever the route changes.
 * Honors `prefers-reduced-motion` (and the in-app override) by rendering
 * children without any animation.
 */
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [displayKey, setDisplayKey] = useState(location.pathname);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip animating the very first paint
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setDisplayKey(location.pathname);
  }, [location.pathname]);

  if (reduced) return <>{children}</>;

  return (
    <div
      key={displayKey}
      className="motion-safe:animate-page-in"
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
