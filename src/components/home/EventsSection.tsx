import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, PartyPopper, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import photoEventImg from "@/assets/photo-event.png";
import photoVideoImg from "@/assets/photo-video.png";
import photoGiftImg from "@/assets/photo-gift.png";
import eventPlaceholderImg from "@/assets/event-placeholder.png";

const PHOTO_FALLBACKS = [photoEventImg, photoVideoImg, photoGiftImg];

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
    <section className="py-8 lg:py-14">
      <div className="container mx-auto px-4 lg:px-8 xl:max-w-7xl space-y-8 lg:space-y-12">

        {/* Event Management */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <PartyPopper className="w-[18px] h-[18px] text-primary" />
                </span>
                <div>
                  <span className="text-primary text-[10px] lg:text-xs font-semibold tracking-wider uppercase">Event Management</span>
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground leading-tight">Event Services</h2>
                </div>
              </div>
              <Link to="/events">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/5 h-8 px-3">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat: any, i: number) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  <Link
                    to={`/events/${cat.slug}`}
                    className="group block rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-md bg-card"
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={cat.image_url || eventPlaceholderImg}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={400}
                        height={300}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
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
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <Camera className="w-[18px] h-[18px] text-primary" />
                </span>
                <div>
                  <span className="text-primary text-[10px] lg:text-xs font-semibold tracking-wider uppercase">Photography</span>
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground leading-tight">Capture Your Moments</h2>
                </div>
              </div>
              <Link to="/photography">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/5 h-8 px-3">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoServices.map((svc: any, i: number) => {
                const fallback = PHOTO_FALLBACKS[i % PHOTO_FALLBACKS.length];
                return (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Link
                      to="/photography"
                      className="group block rounded-2xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card"
                    >
                      <div className="relative overflow-hidden aspect-square bg-muted/30 p-4 flex items-center justify-center">
                        <img
                          src={svc.image_url || fallback}
                          alt={svc.title}
                          className="w-4/5 h-4/5 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md"
                          loading="lazy"
                          width={400}
                          height={400}
                        />
                        {svc.starting_price > 0 && (
                          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                            ৳{svc.starting_price.toLocaleString()}~
                          </span>
                        )}
                      </div>
                      <div className="p-3 text-center border-t border-border/30">
                        <p className="text-sm font-semibold text-foreground leading-tight">{svc.title}</p>
                        {svc.short_description && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{svc.short_description}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
