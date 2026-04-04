import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const AdminMigrate = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const runMigration = async (type: string) => {
    setLoading(type);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("wp-migrate", {
        body: { type },
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        toast.success(`${type === "all" ? "All" : type} migration completed successfully!`);
      } else {
        throw new Error(data.error || "Migration failed");
      }
    } catch (err: any) {
      console.error("Migration error:", err);
      toast.error(err.message || "Migration failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-display font-bold">WordPress Migration</h2>
      <p className="text-muted-foreground">
        Import products, blog posts and categories from pikooly.com.bd. 
        Duplicate slugs will be skipped automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: "categories", label: "Categories", desc: "WooCommerce product categories" },
          { type: "products", label: "Products", desc: "All WooCommerce products" },
          { type: "blogs", label: "Blog Posts", desc: "All WordPress blog posts" },
          { type: "all", label: "Everything", desc: "Categories + Products + Blogs" },
        ].map((item) => (
          <Card key={item.type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{item.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => runMigration(item.type)}
                disabled={loading !== null}
                className="w-full"
                variant={item.type === "all" ? "default" : "outline"}
              >
                {loading === item.type ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Import</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Migration Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.categories && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold">ক্যাটেগরি</p>
                  <p className="text-sm text-muted-foreground">
                    মোট: {results.categories.total} | ম্যাপড: {results.categories.mapped}
                  </p>
                </div>
              )}
              {results.products && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold">প্রোডাক্ট</p>
                  <p className="text-sm text-muted-foreground">
                    মোট: {results.products.total} | নতুন: {results.products.inserted} | স্কিপড: {results.products.skipped}
                  </p>
                </div>
              )}
              {results.blogs && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold">ব্লগ পোস্ট</p>
                  <p className="text-sm text-muted-foreground">
                    মোট: {results.blogs.total} | নতুন: {results.blogs.inserted} | স্কিপড: {results.blogs.skipped}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMigrate;
