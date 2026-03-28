import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const AllGifts = () => {
  const [activeTab, setActiveTab] = useState<"occasions" | "category">("occasions");
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

  const occasions = categories.filter((c: any) => c.category_type === "occasion");
  const categoryItems = categories.filter((c: any) => c.category_type !== "occasion" && c.category_type !== "tailored");

  const getSubsForCat = (catId: string) =>
    subcategories.filter((s: any) => s.category_id === catId);

  const toggleCat = (catId: string) => {
    setExpandedCat(prev => (prev === catId ? null : catId));
  };

  const currentList = activeTab === "occasions" ? occasions : categoryItems;

  return (
    <main className="section-container py-4 pb-24 md:pb-10">
      <SEOHead
        title="All Gifts — Pikooly"
        description="Browse all gift categories and occasions. Find the perfect gift for every celebration at Pikooly."
        canonical={`${window.location.origin}/all-gifts`}
      />
      <h1 className="text-xl font-display font-bold text-foreground mb-4">
        All Gifts
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        <button
          onClick={() => { setActiveTab("occasions"); setExpandedCat(null); }}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${
            activeTab === "occasions"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          Shop By Occasions
        </button>
        <button
          onClick={() => { setActiveTab("category"); setExpandedCat(null); }}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${
            activeTab === "category"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          Shop By Category
        </button>
      </div>

      <div className="space-y-3">
        {currentList.map((cat: any) => {
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
                  to={`/product-category/${cat.slug}`}
                  className="flex items-center gap-3 flex-1 p-3"
                >
                  {activeTab === "category" && (
                    cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-14 h-14 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted" />
                    )
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
                      to={`/product-category/${sub.slug}`}
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

      {currentList.length === 0 && (
        <p className="text-center text-muted-foreground py-10 text-sm">
          No {activeTab === "occasions" ? "occasions" : "categories"} available.
        </p>
      )}
    </main>
  );
};

export default AllGifts;
