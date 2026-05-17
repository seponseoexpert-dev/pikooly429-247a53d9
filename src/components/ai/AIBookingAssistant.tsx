import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMultiCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "event" | "photo";
type ChatMsg = { role: "user" | "assistant"; content: string };
type Recommendation = {
  type: "event" | "photo";
  reason: string;
  packages: any[];
};
type Booking = {
  type: "event" | "photo";
  id: string;
  booking_number: string;
  total: number;
  event_date: string;
  customer_name: string;
};

interface Props {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const greetings: Record<Mode, string> = {
  event:
    "Hi! 👋 I'm your Pikooly Event Concierge. Tell me about your event — what occasion, when, how many guests, and any budget in mind?",
  photo:
    "Hi! 👋 I'm your Pikooly Photo & Video Concierge. What would you like shot — wedding, birthday, corporate, product? Share the date, location and any preferences.",
};

const titles: Record<Mode, string> = {
  event: "AI Event Concierge",
  photo: "AI Photo & Video Concierge",
};

const AIBookingAssistant = ({ mode, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { formatPrice } = useMultiCurrency();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: greetings[mode] },
  ]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset when mode changes or dialog reopens fresh
    if (open) {
      setMessages([{ role: "assistant", content: greetings[mode] }]);
      setRecommendations([]);
      setBooking(null);
      setInput("");
    }
  }, [mode, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, recommendations, booking, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-booking-assistant", {
        body: { mode, messages: next, userId: user?.id || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.recommendations?.length) {
        setRecommendations((prev) => [...prev, ...data.recommendations]);
      }
      if (data?.booking) {
        setBooking(data.booking);
      }
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "" }]);
    } catch (err: any) {
      toast.error(err?.message || "AI failed");
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] p-0 gap-0 h-[85vh] sm:h-[80vh] flex flex-col">
        <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            {titles[mode]}
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {recommendations.map((rec, idx) => (
            <div key={`rec-${idx}`} className="space-y-2">
              {rec.reason && (
                <div className="text-xs text-muted-foreground italic px-1">{rec.reason}</div>
              )}
              <div className="space-y-2">
                {rec.packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="border rounded-xl p-3 bg-card hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{pkg.name}</div>
                        {pkg.duration && (
                          <div className="text-xs text-muted-foreground">{pkg.duration}</div>
                        )}
                        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {pkg.features.slice(0, 4).map((f: any, fi: number) => (
                              <li key={fi} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-primary">•</span>
                                <span className="line-clamp-1">{typeof f === "string" ? f : f?.text || ""}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-sm font-bold text-primary whitespace-nowrap">
                        {formatPrice(Number(pkg.price) || 0)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 h-8 text-xs"
                      onClick={() => send(`I'd like to book the ${pkg.name} package.`)}
                    >
                      Choose this package
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {booking && (
            <div className="border-2 border-primary/40 rounded-xl p-4 bg-primary/5">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Booking Confirmed
              </div>
              <div className="mt-2 text-xs space-y-1 text-foreground">
                <div><span className="text-muted-foreground">Booking #:</span> <span className="font-mono font-semibold">{booking.booking_number}</span></div>
                <div><span className="text-muted-foreground">Date:</span> {booking.event_date}</div>
                <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">{formatPrice(Number(booking.total) || 0)}</span></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Our team will call you shortly to finalize.</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-3.5 py-2 rounded-2xl rounded-bl-sm flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3 flex-shrink-0 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 text-base"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIBookingAssistant;

// Floating CTA button for pages
export const AIBookingCTA = ({ mode, label }: { mode: Mode; label?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
      >
        <Sparkles className="w-4 h-4" />
        {label || (mode === "event" ? "Book with AI Concierge" : "Book with AI Concierge")}
      </Button>
      <AIBookingAssistant mode={mode} open={open} onOpenChange={setOpen} />
    </>
  );
};
