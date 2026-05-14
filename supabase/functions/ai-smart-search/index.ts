// AI Smart Search — natural language → product recommendations
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supaUrl, supaKey);

    // Fetch a candidate set of active products (lightweight fields)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, price, image_url, tags, short_description, category_id, rating")
      .eq("is_active", true)
      .limit(300);
    if (error) throw error;

    // Build compact catalog for the model
    const catalog = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      tags: (p.tags || []).slice(0, 8),
      desc: (p.short_description || "").replace(/<[^>]+>/g, "").slice(0, 120),
    }));

    const system = `You are a gift recommendation assistant for Pikooly (flower & gift shop, Bangladesh). Given a user's natural-language gift request and a product catalog, pick the 8 best matches. Consider occasion, recipient, mood, color, budget (BDT). Reply ONLY valid JSON.`;

    const user = `User query: "${query}"

Catalog (${catalog.length} items):
${JSON.stringify(catalog).slice(0, 60000)}

Return JSON:
{
  "intent": "<1 sentence summary of what user wants>",
  "ids": ["<product id>", ...up to 8, ranked best→good],
  "reason": "<1-2 sentence friendly explanation in English>"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: status === 429 ? "Rate limit reached." : status === 402 ? "AI credits exhausted." : `AI error: ${txt.slice(0,200)}` }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const ids: string[] = Array.isArray(parsed.ids) ? parsed.ids.filter((x: any) => typeof x === "string") : [];
    const byId = new Map((products || []).map((p) => [p.id, p]));
    const matches = ids.map((id) => byId.get(id)).filter(Boolean);

    return new Response(JSON.stringify({
      intent: parsed.intent || "",
      reason: parsed.reason || "",
      products: matches,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
