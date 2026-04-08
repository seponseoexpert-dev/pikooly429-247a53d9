import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, CalendarDays, Clapperboard, Gift, PartyPopper, Sparkles, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCarousel from "@/components/home/ProductCarousel";

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

type PhotoShowcaseItem = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  badge: string;
  icon: LucideIcon;
  priceLabel?: string;
};

const EVENT_CARD_STYLES = [
  { badge: "Most Booked", icon: Sparkles, panelClassName: "from-primary/14 via-primary/5 to-background" },
  { badge: "Family Favorite", icon: Gift, panelClassName: "from-accent/14 via-accent/5 to-background" },
  { badge: "Corporate Ready", icon: Users2, panelClassName: "from-secondary via-muted to-background" },
  { badge: "Premium Setup", icon: CalendarDays, panelClassName: "from-primary/10 via-accent/5 to-background" },
] as const;

const EVENT_SERVICE_FALLBACKS = [
  { id: "event-birthday-setups", title: "Birthday Setups", description: "Theme décor, stage styling, lights and guest-ready arrangements.", href: "/events" },
  { id: "event-anniversary-surprises", title: "Anniversary & Surprise", description: "Romantic backdrops, entry moments and celebration flow handled beautifully.", href: "/events" },
  { id: "event-corporate-activations", title: "Corporate Activations", description: "Professional planning for launches, office events and brand experiences.", href: "/events" },
  { id: "event-wedding-engagement", title: "Wedding Functions", description: "Elegant venue coordination for holud, reception and intimate ceremonies.", href: "/events" },
] as const;

const PHOTO_SERVICE_FALLBACKS = [
  { id: "photo-product-showcase", title: "Product Photography", href: "/photography", imageUrl: photoGiftImg, badge: "Brand Ready", icon: Camera, priceLabel: "Studio Setup" },
  { id: "photo-food-storytelling", title: "Food Photography", href: "/photography", imageUrl: photoEventImg, badge: "Menu Hero", icon: Sparkles, priceLabel: "Styled Shots" },
  { id: "photo-event-coverage", title: "Event Coverage", href: "/photography", imageUrl: photoVideoImg, badge: "Live Moments", icon: PartyPopper, priceLabel: "On Location" },
  { id: "photo-video-reels", title: "Video & Reels", href: "/photography", imageUrl: photoVideoImg, badge: "Social Ready", icon: Clapperboard, priceLabel: "Short-form Edit" },
] as const;

const EventsSection = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["home-event-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_categories").select("*").eq("is_active", true).order("display_order").limit(4);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: photoServices = [] } = useQuery({
    queryKey: ["home-photo-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("photo_services").select("*").eq("is_active", true).eq("is_featured", true).order("display_order").limit(4);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const eventCards: EventShowcaseItem[] = [
    ...categories.slice(0, 4).map((cat: any, index: number) => {
      const style = EVENT_CARD_STYLES[index % EVENT_CARD_STYLES.length];
      return {
        id: cat.id, title: cat.name,
        description: cat.short_description || cat.description || EVENT_SERVICE_FALLBACKS[index]?.description || "Thoughtful event planning.",
        href: `/events/${cat.slug}`, imageUrl: cat.image_url,
        badge: style.badge, icon: style.icon, panelClassName: style.panelClassName,
      };
    }),
    ...EVENT_SERVICE_FALLBACKS.slice(Math.min(categories.length, 4), 4).map((item, offset) => {
      const style = EVENT_CARD_STYLES[(categories.length + offset) % EVENT_CARD_STYLES.length];
      return { id: item.id, title: item.title, description: item.description, href: item.href, imageUrl: null, badge: style.badge, icon: style.icon, panelClassName: style.panelClassName };
    }),
  ].slice(0, 4);

  const photoCards: PhotoShowcaseItem[] = [
    ...photoServices.slice(0, 4).map((svc: any, index: number) => ({
      id: svc.id, title: svc.title, href: "/photography",
      imageUrl: svc.image_url || PHOTO_SERVICE_FALLBACKS[index]?.imageUrl || PHOTO_FALLBACKS[index % PHOTO_FALLBACKS.length],
      badge: PHOTO_SERVICE_FALLBACKS[index]?.badge || "Featured",
      icon: PHOTO_SERVICE_FALLBACKS[index]?.icon || Camera,
      priceLabel: svc.starting_price > 0 ? `৳${svc.starting_price.toLocaleString()}+` : PHOTO_SERVICE_FALLBACKS[index]?.priceLabel,
    })),
    ...PHOTO_SERVICE_FALLBACKS.slice(Math.min(photoServices.length, 4), 4),
  ].slice(0, 4);

  if (eventCards.length === 0 && photoCards.length === 0) return null;

  const cardW = "w-[44vw] sm:w-[42vw] md:w-[30vw] lg:w-auto lg:min-w-0";

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="section-container space-y-6 md:space-y-8">
        {eventCards.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center justify-between sm:mb-3">
              <h2 className="section-heading font-display font-bold text-foreground">Event Services</h2>
              <Link to="/events">
                <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-border/60 px-3 text-xs font-medium hover:bg-accent/40">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
              {eventCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`${cardW} group shrink-0 snap-start overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="relative h-[130px] overflow-hidden sm:h-[140px] md:h-[160px]">
                      <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-background/60 bg-background/90 px-2 py-0.5 text-[9px] font-semibold text-foreground shadow-sm backdrop-blur-sm sm:text-[10px]">
                        <Icon className="h-3 w-3 text-primary" />
                        <span className="truncate">{item.badge}</span>
                      </div>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={320} height={200} />
                      ) : (
                        <div className={`flex h-full items-center justify-center bg-gradient-to-br ${item.panelClassName}`}>
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-background/70 bg-background/90 text-primary shadow-sm">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2 text-center sm:px-3 sm:py-2.5">
                      <p className="text-xs font-semibold leading-tight text-foreground line-clamp-1 sm:text-sm">{item.title}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground line-clamp-1 sm:text-[11px]">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {photoCards.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center justify-between sm:mb-3">
              <h2 className="section-heading font-display font-bold text-foreground">Photography</h2>
              <Link to="/photography">
                <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-border/60 px-3 text-xs font-medium hover:bg-accent/40">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
              {photoCards.map((svc, i) => {
                const Icon = svc.icon;
                return (
                  <Link
                    key={svc.id}
                    to={svc.href}
                    className={`${cardW} group shrink-0 snap-start overflow-hidden rounded-2xl border border-border/40 bg-card p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-3`}
                  >
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border/50 bg-background px-2 py-0.5 text-[9px] font-semibold text-foreground sm:text-[10px]">
                      <Icon className="h-3 w-3 text-primary" />
                      <span className="truncate">{svc.badge}</span>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-muted/20">
                      <img
                        src={svc.imageUrl || PHOTO_FALLBACKS[i % PHOTO_FALLBACKS.length]}
                        alt={svc.title}
                        className="h-[120px] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-[130px]"
                        loading="lazy" width={280} height={180}
                      />
                      {svc.priceLabel && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm sm:text-[10px]">
                          {svc.priceLabel}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 text-center">
                      <p className="text-xs font-semibold leading-tight text-foreground line-clamp-1 sm:text-sm">{svc.title}</p>
                    </div>
                  </Link>
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
