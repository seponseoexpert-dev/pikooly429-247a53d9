import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle, Trash2, Cloud, CloudOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runMigration = async (type: string) => {
    setLoading(type);
    setResults(null);
    setProgress(0);
    setProgressStep("Starting...");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/wp-migrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ type, uploadToCloud, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Migration failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress") {
              setProgress(data.percent || 0);
              setProgressStep(data.step || "");
            } else if (data.type === "done") {
              setResults(data.results);
              setProgress(100);
              setProgressStep("Complete!");
              if (data.results?.removed) {
                toast.success("All data removed successfully!");
              } else {
                toast.success("Migration completed!");
              }
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Migration cancelled");
      } else {
        console.error("Migration error:", err);
        toast.error(err.message || "Migration failed");
      }
    } finally {
      setLoading(null);
      abortRef.current = null;
    }
  };

  const cancelMigration = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-display font-bold">WordPress Migration</h2>
      <p className="text-muted-foreground">
        Import products, blog posts and categories from pikooly.com.bd with full content.
        Duplicate slugs will be skipped automatically.
      </p>

      {/* Progress Bar */}
      {loading && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Migration in Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary">{progress}%</span>
                <Button variant="outline" size="sm" onClick={cancelMigration}>
                  Cancel
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground truncate">{progressStep}</p>
          </CardContent>
        </Card>
      )}

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
            <Switch checked={uploadToCloud} onCheckedChange={setUploadToCloud} disabled={loading !== null} />
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
              <Button variant="destructive" className="w-full" disabled={loading !== null}>
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
                  This action cannot be undone.
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
              All data has been removed. You can now re-import fresh data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMigrate;
