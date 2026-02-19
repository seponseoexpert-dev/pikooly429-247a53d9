import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, FileText, Tag } from "lucide-react";

interface Stats {
  products: number;
  categories: number;
  orders: number;
  blogs: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ products: 0, categories: 0, orders: 0, blogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [products, categories, orders, blogs] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("blogs").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
        blogs: blogs.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Categories", value: stats.categories, icon: Tag, color: "text-accent" },
    { label: "Orders", value: stats.orders, icon: ShoppingCart, color: "text-sage" },
    { label: "Blog Posts", value: stats.blogs, icon: FileText, color: "text-gold" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "..." : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
