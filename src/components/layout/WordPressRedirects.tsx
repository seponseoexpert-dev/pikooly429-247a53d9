import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Handles redirects from old WordPress (pikooly.com.bd) URL patterns
 * to the new site's URL structure to preserve SEO juice.
 */
const WordPressRedirects = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Remove trailing slashes (WordPress uses them, React Router doesn't)
    if (path.length > 1 && path.endsWith("/")) {
      navigate(path.slice(0, -1) + location.search, { replace: true });
      return;
    }

    // WordPress product URL: /product/slug → /product/slug (already matches)
    // WordPress blog date URLs: /2024/01/01/slug → /blog/slug
    const blogDateMatch = path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/);
    if (blogDateMatch) {
      navigate(`/blog/${blogDateMatch[4]}`, { replace: true });
      return;
    }

    // WordPress ?p=123 style URLs - redirect to homepage
    const params = new URLSearchParams(location.search);
    if (params.has("p")) {
      navigate("/", { replace: true });
      return;
    }

    // WordPress /shop/ page with category filter
    if (path === "/shop" && params.has("product_cat")) {
      const cat = params.get("product_cat");
      navigate(`/product-category/${cat}`, { replace: true });
      return;
    }

    // WordPress /cart → /checkout
    if (path === "/cart") {
      navigate("/checkout", { replace: true });
      return;
    }

    // WordPress /my-account → /account
    if (path === "/my-account" || path.startsWith("/my-account/")) {
      navigate("/account", { replace: true });
      return;
    }
  }, [location.pathname, location.search, navigate]);

  return null;
};

export default WordPressRedirects;
