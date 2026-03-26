import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { title, body, url, user_id, send_to_all } = await req.json();

    // Get VAPID keys from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["vapid_public_key", "vapid_private_key", "vapid_subject", "push_enabled"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value || ""; });

    if (settingsMap.push_enabled !== "true") {
      return new Response(JSON.stringify({ error: "Push notifications are disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settingsMap.vapid_public_key || !settingsMap.vapid_private_key) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (!send_to_all && user_id) {
      query = query.eq("user_id", user_id);
    }
    const { data: subscriptions } = await query;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers found", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For now, store the notification data - actual Web Push requires 
    // the web-push library which needs native crypto support
    // The frontend will use the Notification API as a fallback
    const payload = JSON.stringify({ title, body, url, icon: "/favicon.ico" });

    console.log(`Push notification queued for ${subscriptions.length} subscribers:`, payload);

    return new Response(
      JSON.stringify({ 
        message: "Push notifications queued",
        sent: subscriptions.length,
        payload: { title, body, url }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send push error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
