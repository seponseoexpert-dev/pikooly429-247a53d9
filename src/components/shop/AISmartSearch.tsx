import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "Romantic gift for wife under 2500",
  "Birthday surprise for best friend",
  "Anniversary flowers — red roses",
  "Get well soon for mother",
  "Eid gift for parents",
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
    <div className="mb-4 sm:mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Ask AI for the perfect gift</span>
        <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">Beta</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Romantic anniversary gift under 3000 BDT"
          className="bg-background text-base"
          style={{ fontSize: 16 }}
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Find</span></>}
        </Button>
      </form>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => run(s)} className="text-[11px] sm:text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-4 border-t border-primary/10 pt-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground italic flex-1">
              {loading ? "Thinking…" : reason || "Here are some matches:"}
            </p>
            <button onClick={() => { setOpen(false); setProducts([]); setReason(""); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {!loading && products.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No matches found. Try a different request.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group block rounded-lg overflow-hidden bg-background hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                </div>
                <div className="p-2">
                  <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-xs sm:text-sm text-primary font-semibold mt-1">{formatCurrency(Number(p.price) || 0)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
