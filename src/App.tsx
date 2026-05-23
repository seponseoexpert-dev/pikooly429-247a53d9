import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import Header from "@/components/layout/Header";

import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import DynamicHead from "@/components/layout/DynamicHead";
import ScrollToTop from "@/components/layout/ScrollToTop";
import PageLoader from "@/components/layout/PageLoader";
import WordPressRedirects from "@/components/layout/WordPressRedirects";
import AffiliateTracker from "@/components/layout/AffiliateTracker";
import PageTransition from "@/components/layout/PageTransition";
import { lazy, Suspense, useEffect } from "react";

// Retry dynamic imports to recover from transient chunk fetch failures
// (e.g. after a deploy or HMR update where old chunk URLs become stale).
const lazyRetry = <T extends { default: any }>(factory: () => Promise<T>, retries = 2, delay = 400): Promise<T> =>
  factory().catch((err) => {
    if (retries <= 0) {
      // Hard reload as last resort to pick up new chunk hashes
      if (typeof window !== "undefined" && !(window as any).__chunkReloaded) {
        (window as any).__chunkReloaded = true;
        window.location.reload();
      }
      throw err;
    }
    return new Promise((resolve) => setTimeout(resolve, delay)).then(() => lazyRetry(factory, retries - 1, delay * 2));
  });

// Lazy-load non-critical layout components
const Footer = lazy(() => lazyRetry(() => import("@/components/layout/Footer")));
const BottomNav = lazy(() => lazyRetry(() => import("@/components/layout/BottomNav")));
const WhatsAppButton = lazy(() => lazyRetry(() => import("@/components/layout/WhatsAppButton")));

// Eager-load homepage
import Index from "./pages/Index";

// Lazy-load all other pages
const Shop = lazy(() => lazyRetry(() => import("./pages/Shop")));
const ProductDetail = lazy(() => lazyRetry(() => import("./pages/ProductDetail")));
const Blog = lazy(() => lazyRetry(() => import("./pages/Blog")));
const BlogDetail = lazy(() => lazyRetry(() => import("./pages/BlogDetail")));
const AllGifts = lazy(() => lazyRetry(() => import("./pages/AllGifts")));
const Checkout = lazy(() => lazyRetry(() => import("./pages/Checkout")));
const Cart = lazy(() => lazyRetry(() => import("./pages/Cart")));

const OrderSuccess = lazy(() => lazyRetry(() => import("./pages/OrderSuccess")));
const RemittancePayment = lazy(() => lazyRetry(() => import("./pages/RemittancePayment")));
const TrackOrder = lazy(() => lazyRetry(() => import("./pages/TrackOrder")));
const NotFound = lazy(() => lazyRetry(() => import("./pages/NotFound")));
const Auth = lazy(() => lazyRetry(() => import("./pages/Auth")));
const Account = lazy(() => lazyRetry(() => import("./pages/Account")));
const ResetPassword = lazy(() => lazyRetry(() => import("./pages/ResetPassword")));
const AdminLogin = lazy(() => lazyRetry(() => import("./pages/AdminLogin")));
const AdminDashboard = lazy(() => lazyRetry(() => import("./pages/AdminDashboard")));
const EpsCallback = lazy(() => lazyRetry(() => import("./pages/EpsCallback")));
const AboutUs = lazy(() => lazyRetry(() => import("./pages/AboutUs")));
const ContactUs = lazy(() => lazyRetry(() => import("./pages/ContactUs")));
const RefundPolicy = lazy(() => lazyRetry(() => import("./pages/RefundPolicy")));
const PrivacyPolicy = lazy(() => lazyRetry(() => import("./pages/PrivacyPolicy")));
const TermsConditions = lazy(() => lazyRetry(() => import("./pages/TermsConditions")));
const Reviews = lazy(() => lazyRetry(() => import("./pages/Reviews")));
const AdminProducts = lazy(() => lazyRetry(() => import("./pages/admin/AdminProducts")));
const AdminCategories = lazy(() => lazyRetry(() => import("./pages/admin/AdminCategories")));
const AdminOrders = lazy(() => lazyRetry(() => import("./pages/admin/AdminOrders")));
const AdminCustomers = lazy(() => lazyRetry(() => import("./pages/admin/AdminCustomers")));
const AdminBlog = lazy(() => lazyRetry(() => import("./pages/admin/AdminBlog")));
const AdminReviews = lazy(() => lazyRetry(() => import("./pages/admin/AdminReviews")));
const AdminCoupons = lazy(() => lazyRetry(() => import("./pages/admin/AdminCoupons")));
const AdminSettings = lazy(() => lazyRetry(() => import("./pages/admin/AdminSettings")));
const AdminShipping = lazy(() => lazyRetry(() => import("./pages/admin/AdminShipping")));
const AdminCurrencies = lazy(() => lazyRetry(() => import("./pages/admin/AdminCurrencies")));
const AdminSubscribers = lazy(() => lazyRetry(() => import("./pages/admin/AdminSubscribers")));
const AdminMigrate = lazy(() => lazyRetry(() => import("./pages/admin/AdminMigrate")));
const AdminHomepageContent = lazy(() => lazyRetry(() => import("./pages/admin/AdminHomepageContent")));
const AdminBouquet = lazy(() => lazyRetry(() => import("./pages/admin/AdminBouquet")));
const BouquetBuilder = lazy(() => lazyRetry(() => import("./pages/BouquetBuilder")));
const Install = lazy(() => lazyRetry(() => import("./pages/Install")));
const Events = lazy(() => lazyRetry(() => import("./pages/Events")));
const EventCategoryDetail = lazy(() => lazyRetry(() => import("./pages/EventCategoryDetail")));
const AdminEvents = lazy(() => lazyRetry(() => import("./pages/admin/AdminEvents")));
const Photography = lazy(() => lazyRetry(() => import("./pages/Photography")));
const AdminPhotography = lazy(() => lazyRetry(() => import("./pages/admin/AdminPhotography")));
const AdminPopularGifting = lazy(() => lazyRetry(() => import("./pages/admin/AdminPopularGifting")));
const AdminHomeLiving = lazy(() => lazyRetry(() => import("./pages/admin/AdminHomeLiving")));
const AdminAccount = lazy(() => lazyRetry(() => import("./pages/admin/AdminAccount")));
const AdminSecurity = lazy(() => lazyRetry(() => import("./pages/admin/AdminSecurity")));
const AdminActivityLog = lazy(() => lazyRetry(() => import("./pages/admin/AdminActivityLog")));
const AdminCartAddons = lazy(() => lazyRetry(() => import("./pages/admin/AdminCartAddons")));
const AdminBulkOrders = lazy(() => lazyRetry(() => import("./pages/admin/AdminBulkOrders")));
const SearchPage = lazy(() => lazyRetry(() => import("./pages/Search")));
const Affiliate = lazy(() => lazyRetry(() => import("./pages/Affiliate")));
const AdminAffiliates = lazy(() => lazyRetry(() => import("./pages/admin/AdminAffiliates")));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Prefetch routes in two waves so first paint isn't blocked by extra JS parsing.
// Wave 1 (likely-next pages) — fired only after the homepage is idle.
const prefetchPrimary = () => {
  import("./pages/Shop");
  import("./pages/ProductDetail");
  import("./pages/Search");
  import("@/components/layout/Footer");
  import("@/components/layout/BottomNav");
  import("@/components/layout/WhatsAppButton");
};

// Wave 2 (less likely) — fired even later to avoid contending with main-thread work.
const prefetchSecondary = () => {
  import("./pages/Checkout");
  import("./pages/AllGifts");
  import("./pages/Account");
  import("./pages/TrackOrder");
  import("./pages/Auth");
  import("./pages/AboutUs");
  import("./pages/ContactUs");
  import("./pages/Blog");
  import("./pages/Events");
};

const RoutePrefetcher = () => {
  useEffect(() => {
    const w = window as any;
    const schedule = (fn: () => void, delay: number, idleTimeout: number) => {
      if ("requestIdleCallback" in w) {
        return w.requestIdleCallback(fn, { timeout: idleTimeout });
      }
      return setTimeout(fn, delay);
    };
    const id1 = schedule(prefetchPrimary, 3000, 5000);
    const id2 = schedule(prefetchSecondary, 8000, 12000);
    return () => {
      if ("cancelIdleCallback" in w) {
        w.cancelIdleCallback?.(id1);
        w.cancelIdleCallback?.(id2);
      } else {
        clearTimeout(id1 as any);
        clearTimeout(id2 as any);
      }
    };
  }, []);
  return null;
};


const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <div className="pt-[var(--mobile-header-offset,0px)] md:pt-0">
      <Suspense fallback={<PageLoader />}>
        <PageTransition>{children}</PageTransition>
      </Suspense>
    </div>
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
    <Suspense fallback={null}>
      <BottomNav />
    </Suspense>
    <Suspense fallback={null}>
      <WhatsAppButton />
    </Suspense>
  </>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedAdminRoute>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedAdminRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
        <CurrencyProvider>
        <CartProvider>
          <DynamicHead />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <RoutePrefetcher />
            <WordPressRedirects />
            <AffiliateTracker />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
              <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
              <Route path="/product-category/:catSlug" element={<PublicLayout><Shop /></PublicLayout>} />
              <Route path="/product-category/:catSlug/:subSlug" element={<PublicLayout><Shop /></PublicLayout>} />
              <Route path="/all-gifts" element={<PublicLayout><AllGifts /></PublicLayout>} />
              <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
              <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
              <Route path="/blog/:slug" element={<PublicLayout><BlogDetail /></PublicLayout>} />
              <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
              <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
              <Route path="/order-success/:orderNumber" element={<PublicLayout><OrderSuccess /></PublicLayout>} />
              <Route path="/remittance-payment/:orderId" element={<PublicLayout><RemittancePayment /></PublicLayout>} />
              <Route path="/track-order" element={<PublicLayout><TrackOrder /></PublicLayout>} />
              <Route path="/eps-callback" element={<PublicLayout><EpsCallback /></PublicLayout>} />
              <Route path="/about-us" element={<PublicLayout><AboutUs /></PublicLayout>} />
              <Route path="/contact-us" element={<PublicLayout><ContactUs /></PublicLayout>} />
              <Route path="/refund-policy" element={<PublicLayout><RefundPolicy /></PublicLayout>} />
              <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/terms-conditions" element={<PublicLayout><TermsConditions /></PublicLayout>} />
              <Route path="/return-policy" element={<PublicLayout><RefundPolicy /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><TermsConditions /></PublicLayout>} />
              <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
              <Route path="/custom-bouquet" element={<PublicLayout><BouquetBuilder /></PublicLayout>} />
              <Route path="/install" element={<PublicLayout><Install /></PublicLayout>} />
              <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
              <Route path="/events/:slug" element={<PublicLayout><EventCategoryDetail /></PublicLayout>} />
              <Route path="/photography" element={<PublicLayout><Photography /></PublicLayout>} />
              <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
              <Route path="/auth" element={<PublicLayout><Auth /></PublicLayout>} />
              <Route path="/account" element={<PublicLayout><Account /></PublicLayout>} />
              <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
              <Route path="/affiliate" element={<PublicLayout><Affiliate /></PublicLayout>} />
              {/* Admin routes */}
              <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
              <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/shipping" element={<AdminRoute><AdminShipping /></AdminRoute>} />
              <Route path="/admin/currencies" element={<AdminRoute><AdminCurrencies /></AdminRoute>} />
              <Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers /></AdminRoute>} />
              <Route path="/admin/migrate" element={<AdminRoute><AdminMigrate /></AdminRoute>} />
              <Route path="/admin/homepage-content" element={<AdminRoute><AdminHomepageContent /></AdminRoute>} />
              <Route path="/admin/bouquet" element={<AdminRoute><AdminBouquet /></AdminRoute>} />
              <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
              <Route path="/admin/photography" element={<AdminRoute><AdminPhotography /></AdminRoute>} />
              <Route path="/admin/popular-gifting" element={<AdminRoute><AdminPopularGifting /></AdminRoute>} />
              <Route path="/admin/home-living" element={<AdminRoute><AdminHomeLiving /></AdminRoute>} />
              <Route path="/admin/account" element={<AdminRoute><AdminAccount /></AdminRoute>} />
              <Route path="/admin/security" element={<AdminRoute><AdminSecurity /></AdminRoute>} />
              <Route path="/admin/activity" element={<AdminRoute><AdminActivityLog /></AdminRoute>} />
              <Route path="/admin/cart-addons" element={<AdminRoute><AdminCartAddons /></AdminRoute>} />
              <Route path="/admin/bulk-orders" element={<AdminRoute><AdminBulkOrders /></AdminRoute>} />
              <Route path="/admin/affiliates" element={<AdminRoute><AdminAffiliates /></AdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
