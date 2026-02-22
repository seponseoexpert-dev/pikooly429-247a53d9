import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API Key not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Google Place ID from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["google_place_id"]);

    const placeId = settings?.find((s: any) => s.key === "google_place_id")?.value;

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "Google Place ID not set in admin settings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch place details from Google Places API (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount&key=${googleApiKey}`;
    
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Google reviews", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placeData = await response.json();
    const rating = placeData.rating?.toString() || "0";
    const reviewCount = placeData.userRatingCount?.toString() || "0";

    // Update site_settings
    for (const [key, value] of [
      ["google_rating", rating],
      ["google_review_count", reviewCount],
    ]) {
      await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
    }

    return new Response(
      JSON.stringify({
        success: true,
        rating,
        reviewCount,
        message: "Google reviews synced successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
