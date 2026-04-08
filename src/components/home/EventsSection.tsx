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

  const eventCardWidthClass = "w-[82vw] sm:w-[48vw] md:w-[34vw] lg:w-auto lg:min-w-0";
  const photoCardWidthClass = "w-[78vw] sm:w-[44vw] md:w-[30vw] lg:w-auto lg:min-w-0";

  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="section-container space-y-8 md:space-y-10">
        {eventCards.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 md:mb-5">
              <h2 className="section-heading font-display font-bold text-foreground">Event Services</h2>
              <Link to="/events">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full border-primary/25 px-4 text-sm font-medium shadow-sm hover:bg-accent/40"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
              {eventCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`${eventCardWidthClass} group shrink-0 snap-start overflow-hidden rounded-[28px] border border-border/50 bg-card shadow-[0_10px_30px_-18px_hsl(var(--foreground)/0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_hsl(var(--primary)/0.25)]`}
                  >
                    <div className="relative h-[160px] overflow-hidden sm:h-[170px] md:h-[180px]">
                      <div className="absolute left-3 top-3 z-10 inline-flex max-w-[calc(100%-24px)] items-center gap-1.5 rounded-full border border-background/70 bg-background/95 px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm sm:text-xs">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{item.badge}</span>
                      </div>
                      {item.imageUrl ? (
                        <>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            width={420}
                            height={260}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className={`flex h-full items-center justify-center bg-gradient-to-br ${item.panelClassName}`}>
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-background/70 bg-background/90 text-primary shadow-sm backdrop-blur-sm">
                            <Icon className="h-6 w-6" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-5 pt-4 text-center">
                      <p className="text-xl font-semibold leading-tight text-foreground line-clamp-1">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {photoCards.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 md:mb-5">
              <h2 className="section-heading font-display font-bold text-foreground">Photography</h2>
              <Link to="/photography">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full border-primary/25 px-4 text-sm font-medium shadow-sm hover:bg-accent/40"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
              {photoCards.map((svc, i) => {
                const Icon = svc.icon;
                return (
                  <Link
                    key={svc.id}
                    to={svc.href}
                    className={`${photoCardWidthClass} group shrink-0 snap-start rounded-[28px] border border-border/50 bg-card px-4 pb-5 pt-4 shadow-[0_10px_30px_-18px_hsl(var(--foreground)/0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_hsl(var(--primary)/0.22)]`}
                  >
                    <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm sm:text-xs">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{svc.badge}</span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 shadow-sm">
                      <img
                        src={svc.imageUrl || PHOTO_FALLBACKS[i % PHOTO_FALLBACKS.length]}
                        alt={svc.title}
                        className="h-[170px] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-[180px]"
                        loading="lazy"
                        width={360}
                        height={220}
                      />
                      {svc.priceLabel && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md">
                          {svc.priceLabel}
                        </span>
                      )}
                    </div>

                    <div className="pt-5 text-center">
                      <p className="text-xl font-semibold leading-tight text-foreground line-clamp-2">{svc.title}</p>
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
