import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Tag, LogOut, Menu, X, Users, Star, Ticket, Settings, Truck, Coins, Mail, Download, Flower2, CalendarCheck, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", icon: Package, path: "/admin/products" },
      { label: "Categories", icon: Tag, path: "/admin/categories" },
      { label: "Bouquet", icon: Flower2, path: "/admin/bouquet" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
      { label: "Customers", icon: Users, path: "/admin/customers" },
      { label: "Coupons", icon: Ticket, path: "/admin/coupons" },
      { label: "Shipping", icon: Truck, path: "/admin/shipping" },
      { label: "Currencies", icon: Coins, path: "/admin/currencies" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Blog", icon: FileText, path: "/admin/blog" },
      { label: "Reviews", icon: Star, path: "/admin/reviews" },
      { label: "Events", icon: CalendarCheck, path: "/admin/events" },
      { label: "Homepage", icon: LayoutDashboard, path: "/admin/homepage-content" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Subscribers", icon: Mail, path: "/admin/subscribers" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
      { label: "WP Migrate", icon: Download, path: "/admin/migrate" },
    ],
  },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const logoUrl = settings.company_logo || "";
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/admin" className="font-display text-xl font-bold flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={settings.store_name || "Store"} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <span className="text-foreground">{settings.store_name || "Pikooly"}</span>
                <span className="text-primary">Flora</span>
              </>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate px-3">{user?.email}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold truncate">Admin Panel</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
