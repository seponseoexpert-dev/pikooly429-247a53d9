import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Copy, Globe, Loader2, Smartphone, X } from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  advance_amount: number | null;
  is_preorder: boolean | null;
  notes: string | null;
  payment_method: string | null;
}

const SERVICES = [
  { key: "wu", label: "Western Union", enabledKey: "remittance_wu_enabled" },
  { key: "mg", label: "MoneyGram", enabledKey: "remittance_mg_enabled" },
  { key: "ria", label: "Ria", enabledKey: "remittance_ria_enabled" },
  { key: "xm", label: "Xpress Money", enabledKey: "remittance_xm_enabled" },
  { key: "tts", label: "TapTap Send", enabledKey: "remittance_tts_enabled" },
];

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-border/40 first:border-t-0">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">{label}</p>
        <p className="text-[15px] font-semibold text-foreground break-all leading-tight mt-0.5">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied`); }}
        className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Copy size={14} /> Copy
      </button>
    </div>
  );
};

const InfoCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Smartphone;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card border border-border px-4 py-3.5 shadow-sm">
    <div className="flex items-center gap-2.5 mb-1">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Icon size={16} className="text-primary" />
      </span>
      <p className="text-[15px] font-bold text-foreground">{title}</p>
    </div>
    <div className="pl-[44px]">{children}</div>
  </div>
);

const RemittancePayment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<string>("");
  const [mtcn, setMtcn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!orderId) return;
      const [orderRes, settingsRes] = await Promise.all([
        supabase.from("orders").select("id, order_number, total, advance_amount, is_preorder, notes, payment_method").eq("id", orderId).maybeSingle(),
        supabase.from("site_settings").select("key, value").in("key", [
          "company_name", "company_logo",
          "remittance_wu_enabled", "remittance_mg_enabled", "remittance_ria_enabled", "remittance_xm_enabled", "remittance_tts_enabled",
          "remittance_bkash_personal", "remittance_nagad_personal",
          "remittance_bank_name", "remittance_bank_account_name", "remittance_bank_account_number",
          "remittance_bank_routing", "remittance_bank_branch", "remittance_instructions",
        ]),
      ]);
      if (orderRes.data) setOrder(orderRes.data as OrderRow);
      const map: Record<string, string> = {};
      (settingsRes.data || []).forEach((s: any) => { map[s.key] = s.value || ""; });
      setSettings(map);
      setLoading(false);
    })();
  }, [orderId]);

  const enabledServices = useMemo(
    () => SERVICES.filter((s) => (settings[s.enabledKey] || "").toLowerCase() === "true" || settings[s.enabledKey] === "1" || settings[s.enabledKey] === "enable"),
    [settings]
  );

  // Auto-pick first enabled service
  useEffect(() => {
    if (!service && enabledServices.length > 0) setService(enabledServices[0].key);
  }, [enabledServices, service]);

  const amount = order ? Number(order.is_preorder ? (order.advance_amount || order.total) : order.total) : 0;
  const serviceLabel = enabledServices.find((s) => s.key === service)?.label || "";

  const handleConfirm = async () => {
    if (!order) return;
    if (!service) { toast.error("Please select a remittance service."); return; }
    if (!mtcn.trim()) { toast.error("Please enter the MTCN / reference number."); return; }
    setSubmitting(true);
    try {
      const note = `Global Remittance via ${serviceLabel} | Ref: ${mtcn.trim()}`;
      const mergedNotes = [order.notes || "", note].filter(Boolean).join("\n");
      const { error } = await supabase
        .from("orders")
        .update({ payment_method: `remittance:${service}`, notes: mergedNotes })
        .eq("id", order.id);
      if (error) throw error;
      toast.success("Payment details submitted! We'll verify shortly. 🎉");
      navigate(`/order-success/${order.order_number}`);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to submit payment details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Order not found</h1>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </main>
    );
  }

  const hasBkash = !!settings.remittance_bkash_personal;
  const hasNagad = !!settings.remittance_nagad_personal;
  const hasBank = !!(settings.remittance_bank_account_number || settings.remittance_bank_name);
  const brand = settings.company_name || "Pikooly";

  return (
    <main className="min-h-screen bg-muted/30 py-4 sm:py-8 px-3 sm:px-4">
      <Helmet>
        <title>Global Remittance Payment — {brand}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="max-w-xl mx-auto space-y-4">
        {/* Brand header card */}
        <div className="rounded-2xl bg-card border border-border shadow-sm px-4 py-3.5 flex items-center gap-3">
          {settings.company_logo ? (
            <img src={settings.company_logo} alt={brand} className="h-10 w-10 rounded-lg object-contain bg-muted/40" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              {brand.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-foreground leading-tight">{brand}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Order: {order.order_number}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            aria-label="Cancel and return"
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Service tabs */}
        {enabledServices.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
            No remittance services are enabled. Please contact support.
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border p-2 shadow-sm">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {enabledServices.map((s) => {
                const active = service === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setService(s.key)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Receivers */}
        {service && (
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Globe size={16} className="text-primary" />
              </span>
              <div className="pt-0.5">
                <p className="text-[15px] font-bold text-foreground leading-snug">
                  Send via {serviceLabel} to any receiver below
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Amount: <span className="font-semibold text-foreground">৳{amount.toFixed(2)}</span>
                </p>
              </div>
            </div>

            {settings.remittance_instructions && (
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed pl-[46px]">
                {settings.remittance_instructions}
              </p>
            )}

            {hasBkash && (
              <InfoCard icon={Smartphone} title="bKash (Personal)">
                <CopyRow label="Number" value={settings.remittance_bkash_personal} />
              </InfoCard>
            )}
            {hasNagad && (
              <InfoCard icon={Smartphone} title="Nagad (Personal)">
                <CopyRow label="Number" value={settings.remittance_nagad_personal} />
              </InfoCard>
            )}
            {hasBank && (
              <InfoCard icon={Building2} title="Bank Transfer">
                <CopyRow label="Bank" value={settings.remittance_bank_name} />
                <CopyRow label="A/C Name" value={settings.remittance_bank_account_name} />
                <CopyRow label="A/C Number" value={settings.remittance_bank_account_number} />
                <CopyRow label="Routing / SWIFT" value={settings.remittance_bank_routing} />
                <CopyRow label="Branch" value={settings.remittance_bank_branch} />
              </InfoCard>
            )}
          </div>
        )}

        {/* MTCN */}
        {service && (
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-2 shadow-sm">
            <Label htmlFor="mtcn" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Transaction / Sender Reference (MTCN) *
            </Label>
            <Input
              id="mtcn"
              placeholder="Enter the reference number you received"
              value={mtcn}
              onChange={(e) => setMtcn(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-[11px] text-muted-foreground">
              After sending, paste the tracking/MTCN number here so we can verify your payment.
            </p>
          </div>
        )}

        {/* Confirm bar */}
        <div className="sticky bottom-3 sm:bottom-4 z-10">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || enabledServices.length === 0}
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : `Confirm Payment ৳${amount.toFixed(2)}`}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-2 px-4">
            By clicking confirm, you acknowledge that you have sent the amount and provided a valid reference for verification.
          </p>
        </div>
      </div>
    </main>
  );
};

export default RemittancePayment;
