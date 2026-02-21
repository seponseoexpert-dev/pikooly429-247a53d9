import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import CartDrawer from "@/components/layout/CartDrawer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import DynamicHead from "@/components/layout/DynamicHead";
import ScrollToTop from "@/components/layout/ScrollToTop";
import PageLoader from "@/components/layout/PageLoader";
import { lazy, Suspense } from "react";

// Eager-load homepage
import Index from "./pages/Index";

// Lazy-load all other pages
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const AllGifts = lazy(() => import("./pages/AllGifts"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EpsCallback = lazy(() => import("./pages/EpsCallback"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminCurrencies = lazy(() => import("./pages/admin/AdminCurrencies"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));

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


const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <CartDrawer />
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
    <Footer />
    <BottomNav />
    <WhatsAppButton />
  </>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedAdminRoute>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedAdminRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CurrencyProvider>
        <CartProvider>
          <DynamicHead />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
              <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
              <Route path="/all-gifts" element={<PublicLayout><AllGifts /></PublicLayout>} />
              <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
              <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
              <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
              <Route path="/order-success/:orderNumber" element={<PublicLayout><OrderSuccess /></PublicLayout>} />
              <Route path="/track-order" element={<PublicLayout><TrackOrder /></PublicLayout>} />
              <Route path="/eps-callback" element={<PublicLayout><EpsCallback /></PublicLayout>} />
              <Route path="/about-us" element={<PublicLayout><AboutUs /></PublicLayout>} />
              <Route path="/contact-us" element={<PublicLayout><ContactUs /></PublicLayout>} />
              <Route path="/auth" element={<PublicLayout><Auth /></PublicLayout>} />
              <Route path="/account" element={<PublicLayout><Account /></PublicLayout>} />
              <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
