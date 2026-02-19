import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";

const AllGifts = () => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["public-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const getSubsForCat = (catId: string) =>
    subcategories.filter((s: any) => s.category_id === catId);

  const toggleCat = (catId: string) => {
    setExpandedCat(prev => (prev === catId ? null : catId));
  };

  return (
    <main className="section-container py-4 pb-24 md:pb-10">
      <h1 className="text-xl font-display font-bold text-foreground mb-5">
        All Gifts
      </h1>

      <div className="space-y-3">
        {categories.map((cat: any) => {
          const subs = getSubsForCat(cat.id);
          const isExpanded = expandedCat === cat.id;
          const hasSubs = subs.length > 0;

          return (
            <div
              key={cat.id}
              className="border border-border/60 rounded-xl overflow-hidden bg-card"
            >
              {/* Category header */}
              <div className="flex items-center justify-between">
                <Link
                  to={`/shop?cat=${cat.slug}`}
                  className="flex items-center gap-3 flex-1 p-3"
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-14 h-14 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted" />
                  )}
                  <span className="font-medium text-foreground text-sm">
                    {cat.name}
                  </span>
                </Link>
                {hasSubs && (
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="p-3 text-muted-foreground active:scale-90 transition-transform"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>

              {/* Subcategories */}
              {hasSubs && isExpanded && (
                <div className="border-t border-border/40 px-3 pb-2">
                  {subs.map((sub: any) => (
                    <Link
                      key={sub.id}
                      to={`/shop?cat=${cat.slug}&sub=${sub.slug}`}
                      className="flex items-center justify-between py-3 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                    >
                      <span>{sub.name}</span>
                      <ChevronDown className="h-4 w-4 opacity-40" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-muted-foreground py-10 text-sm">
          No categories available.
        </p>
      )}
    </main>
  );
};

export default AllGifts;
