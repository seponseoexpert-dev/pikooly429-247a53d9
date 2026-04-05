import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Camera, PartyPopper } from "lucide-react";
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
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: photoServices = [] } = useQuery({
    queryKey: ["home-photo-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_services")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order")
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  if (categories.length === 0 && photoServices.length === 0) return null;

  return (
    <section className="py-10 lg:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 lg:px-8 xl:max-w-7xl space-y-10 lg:space-y-14">

        {/* Event Management */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5 lg:mb-7">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <PartyPopper className="w-4.5 h-4.5 text-primary" />
                </span>
                <div>
                  <span className="text-primary text-[11px] lg:text-xs font-semibold tracking-wider uppercase">Event Management</span>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-tight">Event Services</h2>
                </div>
              </div>
              <Link to="/events">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/5">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat: any, i: number) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    to={`/events/${cat.slug}`}
                    className="group block rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:shadow-lg bg-card"
                  >
                    {cat.image_url ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-28 md:h-36 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-full h-28 md:h-36 lg:h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-2.5 text-center">
                      <p className="text-xs md:text-sm font-semibold text-foreground truncate">{cat.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Photography & Videography */}
        {photoServices.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5 lg:mb-7">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <Camera className="w-4.5 h-4.5 text-primary" />
                </span>
                <div>
                  <span className="text-primary text-[11px] lg:text-xs font-semibold tracking-wider uppercase">Photography</span>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-tight">Capture Your Moments</h2>
                </div>
              </div>
              <Link to="/photography">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/5">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {photoServices.map((svc: any, i: number) => (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    to="/photography"
                    className="group block rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:shadow-lg bg-card"
                  >
                    {svc.image_url ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={svc.image_url}
                          alt={svc.title}
                          className="w-full h-28 md:h-36 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {svc.starting_price > 0 && (
                          <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            ৳{svc.starting_price.toLocaleString()}~
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-28 md:h-36 lg:h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-2.5 text-center">
                      <p className="text-xs md:text-sm font-semibold text-foreground truncate">{svc.title}</p>
                      {svc.short_description && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{svc.short_description}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
