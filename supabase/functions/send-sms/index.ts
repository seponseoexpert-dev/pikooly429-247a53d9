import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all SMS gateway settings
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "twilio_account_sid", "twilio_auth_token", "twilio_from", "twilio_status",
        "clickatell_apikey", "clickatell_status",
        "nexmo_key", "nexmo_secret", "nexmo_status",
      ]);

    if (settingsError) throw settingsError;

    const config: Record<string, string> = {};
    settings?.forEach((s: any) => { config[s.key] = s.value || ""; });

    const isEnabled = (v: string) => ["enable", "enabled", "true", "1", "yes", "on"].includes((v || "").toLowerCase());

    // Convert local BD number to E.164 format
    const formatPhone = (phone: string): string => {
      let cleaned = phone.replace(/[^0-9+]/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "+88" + cleaned;
      } else if (cleaned.startsWith("88") && !cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
      } else if (!cleaned.startsWith("+")) {
        cleaned = "+88" + cleaned;
      }
      return cleaned;
    };

    const formattedTo = formatPhone(to);

    // Try Twilio first
    if (isEnabled(config.twilio_status) && config.twilio_account_sid && config.twilio_auth_token && config.twilio_from) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json`;
      const auth = btoa(`${config.twilio_account_sid}:${config.twilio_auth_token}`);

      const body = new URLSearchParams({
        To: formattedTo,
        From: config.twilio_from.startsWith("+") ? config.twilio_from : "+88" + config.twilio_from,
        Body: message,
      });

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Twilio error:", result);
        return new Response(JSON.stringify({ error: result.message || "Twilio send failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, provider: "twilio", sid: result.sid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Clickatell
    if (isEnabled(config.clickatell_status) && config.clickatell_apikey) {
      const res = await fetch("https://platform.clickatell.com/messages/http/send", {
        method: "POST",
        headers: {
          "Authorization": config.clickatell_apikey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          content: message,
          to: [formattedTo.replace(/[^0-9]/g, "")],
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Clickatell error:", result);
        return new Response(JSON.stringify({ error: "Clickatell send failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, provider: "clickatell" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Nexmo (Vonage)
    if (isEnabled(config.nexmo_status) && config.nexmo_key && config.nexmo_secret) {
      const res = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: config.nexmo_key,
          api_secret: config.nexmo_secret,
          to: formattedTo.replace(/[^0-9]/g, ""),
          from: "PikoolyFlora",
          text: message,
        }),
      });

      const result = await res.json();
      if (result.messages?.[0]?.status !== "0") {
        console.error("Nexmo error:", result);
        return new Response(JSON.stringify({ error: "Nexmo send failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, provider: "nexmo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "No SMS gateway is configured or enabled. Please set up SMS in Admin > Settings > SMS Gateway." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send SMS error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to send SMS" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
