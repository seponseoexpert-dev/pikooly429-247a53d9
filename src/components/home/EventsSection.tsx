import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const EventsSection = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["home-event-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Event Management
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">ইভেন্ট ম্যানেজমেন্ট সার্ভিস</h2>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat: any, i: number) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to="/events"
                className="group block rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-28 md:h-36 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-28 md:h-36 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <div className="p-2.5 bg-card">
                  <p className="text-sm font-medium text-foreground text-center truncate">{cat.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
