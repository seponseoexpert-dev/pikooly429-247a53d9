import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle, Trash2, Cloud, CloudOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminMigrate = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [uploadToCloud, setUploadToCloud] = useState(true);

  const runMigration = async (type: string) => {
    setLoading(type);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("wp-migrate", {
        body: { type, uploadToCloud },
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        if (type === "remove_all") {
          toast.success("All data removed successfully!");
        } else {
          toast.success(`${type === "all" ? "All" : type} migration completed!`);
        }
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
        Import products, blog posts and categories from pikooly.com.bd with full content.
        Duplicate slugs will be skipped automatically.
      </p>

      {/* Cloudinary Upload Toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {uploadToCloud ? (
                <Cloud className="h-5 w-5 text-primary" />
              ) : (
                <CloudOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-medium">Upload Images to Cloudinary</Label>
                <p className="text-xs text-muted-foreground">
                  {uploadToCloud
                    ? "All images will be uploaded to Cloudinary (slower but recommended)"
                    : "Images will use original WordPress URLs"}
                </p>
              </div>
            </div>
            <Switch checked={uploadToCloud} onCheckedChange={setUploadToCloud} />
          </div>
        </CardContent>
      </Card>

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: "categories", label: "Categories", desc: "WooCommerce product categories" },
          { type: "products", label: "Products", desc: "All products with full HTML content" },
          { type: "blogs", label: "Blog Posts", desc: "All blog posts with full content" },
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

      {/* Remove All Data */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Remove All Data
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Delete all categories, products, and blog posts. You can then re-import fresh data.
          </p>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={loading !== null}
              >
                {loading === "remove_all" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...</>
                ) : (
                  <><Trash2 className="mr-2 h-4 w-4" /> Remove All & Re-import</>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL categories, products, subcategories, and blog posts.
                  This action cannot be undone. You can re-import after removal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => runMigration("remove_all")}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Remove All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Results */}
      {results && !results.removed && (
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
                  <p className="font-semibold">Categories</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {results.categories.total} | Mapped: {results.categories.mapped}
                  </p>
                </div>
              )}
              {results.products && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold">Products</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {results.products.total} | New: {results.products.inserted} | Skipped: {results.products.skipped}
                  </p>
                </div>
              )}
              {results.blogs && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold">Blog Posts</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {results.blogs.total} | New: {results.blogs.inserted} | Skipped: {results.blogs.skipped}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {results?.removed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              All Data Removed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All categories, products, and blog posts have been removed. You can now re-import fresh data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMigrate;
