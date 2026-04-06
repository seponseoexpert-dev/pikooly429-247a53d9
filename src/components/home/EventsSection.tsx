import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, CalendarDays, Gift, PartyPopper, Sparkles, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import photoEventImg from "@/assets/photo-event.png";
import photoVideoImg from "@/assets/photo-video.png";
import photoGiftImg from "@/assets/photo-gift.png";

const PHOTO_FALLBACKS = [photoEventImg, photoVideoImg, photoGiftImg];

type EventShowcaseItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  badge: string;
  icon: LucideIcon;
  panelClassName: string;
};

const EVENT_CARD_STYLES = [
  {
    badge: "Most Booked",
    icon: Sparkles,
    panelClassName: "from-primary/14 via-primary/5 to-background",
  },
  {
    badge: "Family Favorite",
    icon: Gift,
    panelClassName: "from-accent/14 via-accent/5 to-background",
  },
  {
    badge: "Corporate Ready",
    icon: Users2,
    panelClassName: "from-secondary via-muted to-background",
  },
  {
    badge: "Premium Setup",
    icon: CalendarDays,
    panelClassName: "from-primary/10 via-accent/5 to-background",
  },
] as const;

const EVENT_SERVICE_FALLBACKS = [
  {
    id: "event-birthday-setups",
    title: "Birthday Setups",
    description: "Theme décor, stage styling, lights and guest-ready arrangements.",
    href: "/events",
  },
  {
    id: "event-anniversary-surprises",
    title: "Anniversary & Surprise",
    description: "Romantic backdrops, entry moments and celebration flow handled beautifully.",
    href: "/events",
  },
  {
    id: "event-corporate-activations",
    title: "Corporate Activations",
    description: "Professional planning for launches, office events and brand experiences.",
    href: "/events",
  },
  {
    id: "event-wedding-engagement",
    title: "Wedding Functions",
    description: "Elegant venue coordination for holud, reception and intimate ceremonies.",
    href: "/events",
  },
] as const;

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

  const eventCards: EventShowcaseItem[] = [
    ...categories.slice(0, 4).map((cat: any, index: number) => {
      const style = EVENT_CARD_STYLES[index % EVENT_CARD_STYLES.length];

      return {
        id: cat.id,
        title: cat.name,
        description:
          cat.short_description ||
          cat.description ||
          EVENT_SERVICE_FALLBACKS[index]?.description ||
          "Thoughtful event planning with décor, coordination and on-ground execution.",
        href: `/events/${cat.slug}`,
        imageUrl: cat.image_url,
        badge: style.badge,
        icon: style.icon,
        panelClassName: style.panelClassName,
      };
    }),
    ...EVENT_SERVICE_FALLBACKS.slice(Math.min(categories.length, 4), 4).map((item, offset) => {
      const style = EVENT_CARD_STYLES[(categories.length + offset) % EVENT_CARD_STYLES.length];

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        href: item.href,
        imageUrl: null,
        badge: style.badge,
        icon: style.icon,
        panelClassName: style.panelClassName,
      };
    }),
  ].slice(0, 4);

  if (categories.length === 0 && photoServices.length === 0) return null;

  return (
    <section className="py-8 lg:py-14">
      <div className="container mx-auto px-4 lg:px-8 xl:max-w-7xl space-y-8 lg:space-y-12">

        {/* Event Management */}
        {eventCards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground leading-tight">Event Services</h2>
              <Link to="/events">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/5 h-8 px-3">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-4 px-4">
              {eventCards.map((item, i: number) => {
                const Icon = item.icon;

                return (
                <motion.div
                  key={item.id}
                  className="snap-start shrink-0 w-[160px] md:w-[220px]"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  <Link
                    to={item.href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className={`relative h-[120px] md:h-[140px] overflow-hidden bg-gradient-to-br ${item.panelClassName}`}>
                      {item.imageUrl ? (
                        <>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            width={400}
                            height={300}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="relative flex h-full items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/85 text-primary shadow-sm backdrop-blur-sm">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 md:p-3 text-center">
                      <p className="text-xs md:text-sm font-semibold text-foreground leading-snug line-clamp-1 whitespace-nowrap">{item.title}</p>
                    </div>
                  </Link>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photography & Videography */}
        {photoServices.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground leading-tight">Photography</h2>
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
