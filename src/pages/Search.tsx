import { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, X, Clock, TrendingUp, ArrowUpRight, Mic } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMultiCurrency } from "@/contexts/CurrencyContext";

const sanitizeSearchTerm = (value: string) =>
  value.replace(/&amp;|&#38;|&#038;/gi, "&").replace(/&nbsp;/gi, " ").replace(/<[^>]*>/g, " ").replace(/[,%()']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

const normalizeSearchText = (value?: string | null) => sanitizeSearchTerm(value || "").toLowerCase();

const scoreSearchText = (candidate: string, term: string) => {
  const n = normalizeSearchText(candidate);
  if (!n || !term) return 0;
  if (n === term) return 1000;
  if (n.startsWith(term)) return 700;
  const words = n.split(" ").filter(Boolean);
  if (words.some(w => w === term)) return 650;
  if (words.some(w => w.startsWith(term))) return 550;
  if (n.includes(term)) return 300;
  return 0;
};

const getSearchKeywordBonus = (term: string, haystack: string) => {
  if (term.length !== 1) return 0;
  const boosts: Record<string, string[]> = { f: ["flower", "flowers", "floral"], b: ["bouquet", "birthday", "box"], c: ["cake", "combo", "carnation"], r: ["rose", "roses"] };
  return (boosts[term] || []).some(k => haystack.includes(k)) ? 120 : 0;
};

const rankSearchItems = <T extends { name?: string | null; slug?: string | null; short_description?: string | null }>(items: T[], term: string, limit: number) => {
  const t = normalizeSearchText(term);
  return items.map(item => {
    const name = normalizeSearchText(item.name);
    const slug = normalizeSearchText((item.slug || "").replace(/-/g, " "));
    const sd = normalizeSearchText(item.short_description);
    const h = `${name} ${slug} ${sd}`.trim();
    const score = Math.max(scoreSearchText(name, t), Math.max(scoreSearchText(slug, t) - 40, 0), Math.max(scoreSearchText(sd, t) - 80, 0)) + getSearchKeywordBonus(t, h);
    return { item, score, name };
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit).map(({ item }) => item);
};

const HighlightMatch = ({ text, query }: { text: string; query: string }): ReactNode => {
  if (!query || query.length < 1) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return <>{parts.map((part, i) => regex.test(part) ? <span key={i} className="text-primary font-bold">{part}</span> : <span key={i}>{part}</span>)}</>;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const { formatPrice } = useMultiCurrency();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setSearchQuery(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [isListening]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 8));
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(sanitizeSearchTerm(searchQuery)), 180);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const saveRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches(prev => {
      const updated = [clean, ...prev.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try { localStorage.setItem("recent-searches", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem("recent-searches"); } catch {}
  }, []);

  const { data: searchResults = { products: [], cats: [], subs: [] }, isFetching: isSearching } = useQuery({
    queryKey: ["search-page", debouncedSearch],
    queryFn: async () => {
      const term = normalizeSearchText(debouncedSearch);
      if (!term) return { products: [], cats: [], subs: [] };
      const [prodRes, catRes, subRes] = await Promise.all([
        supabase.from("products").select("id, name, slug, price, original_price, image_url, short_description").eq("is_active", true).or(`name.ilike.%${term}%,short_description.ilike.%${term}%,slug.ilike.%${term}%`).limit(24),
        supabase.from("categories").select("id, name, slug, image_url").eq("is_active", true).ilike("name", `%${term}%`).limit(16),
        supabase.from("subcategories").select("id, name, slug, image_url, category_id").eq("is_active", true).ilike("name", `%${term}%`).limit(24),
      ]);
      return { products: rankSearchItems(prodRes.data || [], term, 12), cats: rankSearchItems(catRes.data || [], term, 8), subs: rankSearchItems(subRes.data || [], term, 10) };
    },
    enabled: debouncedSearch.length >= 1,
    staleTime: 60 * 1000,
    placeholderData: prev => prev,
  });

  // Popular categories
  const { data: popularCategories = [] } = useQuery({
    queryKey: ["search-popular-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug, image_url").eq("is_active", true).eq("show_in_homepage", true).order("display_order").limit(8);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Trending products
  const { data: trendingProducts = [] } = useQuery({
    queryKey: ["search-trending"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, slug, price, original_price, image_url").eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(6);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const hasResults = searchResults.products.length > 0 || searchResults.cats.length > 0 || searchResults.subs.length > 0;
  const showIdle = debouncedSearch.length === 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = sanitizeSearchTerm(searchQuery);
    if (q) { saveRecentSearch(q); navigate(`/shop?search=${encodeURIComponent(q)}`); }
  };

  const handleSelect = (slug: string) => { saveRecentSearch(searchQuery); navigate(`/product/${slug}`); };
  const handleCatClick = (slug: string) => { saveRecentSearch(searchQuery); navigate(`/product-category/${slug}`); };
  const handleRecentClick = (term: string) => setSearchQuery(term);

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header - sticky, FNP style */}
      <div className="sticky top-0 z-50 bg-card safe-area-top">
        <div className="px-3 py-3 sm:px-4 md:px-6">
          <form onSubmit={handleSearch} className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.10)]">
            <button type="button" onClick={() => navigate(-1)} className="shrink-0 text-foreground/60 hover:text-foreground transition-colors active:scale-95" aria-label="Go back">
              <ArrowLeft size={22} />
            </button>
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              enterKeyHint="search"
              inputMode="search"
              maxLength={60}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value.slice(0, 60))}
              placeholder="Search flowers, cakes, gifts..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            ) : (
              <button type="button" onClick={() => { /* voice search placeholder */ }} className="shrink-0 text-primary/70 hover:text-primary transition-colors" aria-label="Voice search">
                <Mic size={20} />
              </button>
            )}
          </form>
        </div>
        <div className="border-b border-border/30" />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Idle State - Recent + Trending + Popular */}
        {showIdle && (
          <div className="animate-fade-in">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock size={14} className="text-muted-foreground" /> Recent Search
                  </h3>
                  <button onClick={clearRecentSearches} className="text-xs text-primary font-medium hover:underline">Clear All</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-muted/50 hover:bg-primary/10 text-xs font-medium text-foreground/80 hover:text-primary transition-colors border border-border/30"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {recentSearches.length > 0 && <div className="mx-4 my-2 border-t border-border/30" />}

            {/* Trending Gifts */}
            {trendingProducts.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                  <TrendingUp size={14} className="text-primary" /> Trending Gifts
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  {trendingProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.slug)}
                      className="shrink-0 snap-start w-[100px] flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-[88px] h-[88px] rounded-xl overflow-hidden ring-1 ring-border/40 group-hover:ring-primary/30 transition-all">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center"><Search size={20} className="text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-foreground/70 group-hover:text-primary text-center line-clamp-2 leading-tight transition-colors">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Categories */}
            {popularCategories.length > 0 && (
              <div className="px-4 pt-3 pb-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Popular Categories</h3>
                <div className="space-y-0.5">
                  {popularCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCatClick(cat.slug)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors text-left group"
                    >
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-border/40" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-muted shrink-0 ring-1 ring-border/40" />
                      )}
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors flex-1">{cat.name}</span>
                      <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {!showIdle && (
          <div className="animate-fade-in">
            {isSearching && (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Searching...
              </div>
            )}

            {!isSearching && searchResults.cats.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Categories</p>
                {searchResults.cats.map(cat => (
                  <button key={cat.id} onClick={() => handleCatClick(cat.slug)} className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-primary/5 transition-colors text-left group">
                    {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-border/40" loading="lazy" />}
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors"><HighlightMatch text={cat.name} query={debouncedSearch} /></span>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchResults.subs.length > 0 && (
              <div className={`px-4 pt-2 pb-1 ${searchResults.cats.length > 0 ? "border-t border-border/30 mt-1" : ""}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Subcategories</p>
                {searchResults.subs.map(sub => (
                  <button key={sub.id} onClick={() => handleCatClick(sub.slug)} className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-primary/5 transition-colors text-left group">
                    {sub.image_url && <img src={sub.image_url} alt={sub.name} className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-border/40" loading="lazy" />}
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors"><HighlightMatch text={sub.name} query={debouncedSearch} /></span>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchResults.products.length > 0 && (
              <div className={`px-4 pt-2 pb-4 ${(searchResults.cats.length > 0 || searchResults.subs.length > 0) ? "border-t border-border/30 mt-1" : ""}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Products</p>
                {searchResults.products.map(p => (
                  <button key={p.id} onClick={() => handleSelect(p.slug)} className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-primary/5 transition-colors text-left group">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-border/40 group-hover:ring-primary/30 transition-all" loading="lazy" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors"><HighlightMatch text={p.name} query={debouncedSearch} /></p>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {formatPrice(p.price)}
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-muted-foreground line-through ml-1.5 font-normal">{formatPrice(p.original_price)}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && hasResults && (
              <button onClick={handleSearch as any} className="w-full border-t border-border/40 px-4 py-3.5 text-center text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                View all results for "{debouncedSearch}" →
              </button>
            )}

            {!isSearching && !hasResults && debouncedSearch.length >= 1 && (
              <div className="px-4 py-12 text-center">
                <Search size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No results found for "{debouncedSearch}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different keyword</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
