import { useState } from "react";
import { Sparkles, Loader2, X, Wand2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  { label: "Romantic gift for wife under 2500", emoji: "💝" },
  { label: "Birthday surprise for best friend", emoji: "🎂" },
  { label: "Anniversary red roses", emoji: "🌹" },
  { label: "Get well soon for mother", emoji: "🌷" },
  { label: "Eid gift for parents", emoji: "🎁" },
  { label: "Congratulations bouquet", emoji: "💐" },
];

export default function AISmartSearch() {
  const { formatCurrency } = useCurrency();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  const run = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-smart-search", { body: { query: text } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setProducts((data as any).products || []);
      setReason((data as any).reason || "");
    } catch (e: any) {
      toast({ title: "AI search failed", description: e.message || "Try again", variant: "destructive" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-primary/5 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)]">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative p-5 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="h-3 w-3 animate-pulse" />
              AI Powered · Beta
            </span>
          </div>

          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Find the <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">perfect gift</span> in seconds
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 max-w-xl mx-auto">
            Tell us the occasion, recipient, or budget — our AI will pick the best matches for you.
          </p>

          {/* Search bar */}
          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="max-w-2xl mx-auto">
            <div className="relative flex items-center gap-2 rounded-2xl bg-background border border-border shadow-sm focus-within:border-primary focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)] transition-all p-1.5 sm:p-2">
              <Wand2 className="h-5 w-5 text-primary ml-2 sm:ml-3 shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Romantic anniversary gift under 3000 BDT"
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-base px-0 h-11 sm:h-12"
                style={{ fontSize: 16 }}
              />
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                size="lg"
                className="rounded-xl h-11 sm:h-12 px-3 sm:px-5 shrink-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary shadow-md"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </>
                )}
              </Button>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => run(s.label)}
                  className="group inline-flex items-center gap-1 text-xs sm:text-sm bg-background/80 hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary text-foreground/80 rounded-full px-3 py-1.5 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-sm">{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </form>

          {/* Results */}
          {open && (
            <div className="mt-6 sm:mt-8 rounded-2xl bg-background/70 backdrop-blur border border-border p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground/80 italic flex-1">
                    {loading ? "Thinking of the best matches…" : reason || "Here are some matches:"}
                  </p>
                </div>
                <button
                  onClick={() => { setOpen(false); setProducts([]); setReason(""); }}
                  className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-muted/50 animate-pulse">
                      <div className="aspect-square bg-muted" />
                      <div className="p-2 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && products.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No matches found. Try a different request.</p>
              )}

              {!loading && products.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {products.slice(0, 8).map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        className="group block rounded-xl overflow-hidden bg-background border border-border hover:border-primary hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square bg-muted overflow-hidden">
                          {p.image_url && (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                        </div>
                        <div className="p-2 sm:p-2.5">
                          <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight min-h-[2.5rem]">{p.name}</p>
                          <p className="text-xs sm:text-sm text-primary font-bold mt-1">{formatCurrency(Number(p.price) || 0)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:gap-2 transition-all"
                    >
                      Explore all gifts <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
