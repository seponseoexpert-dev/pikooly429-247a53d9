// AI Smart Search — natural language → product recommendations
// Provider is admin-controlled via site_settings.ai_search_provider:
//   "lovable" (default) | "gemini" | "openai" | "anthropic"
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULTS: Record<string, string> = {
  lovable: "google/gemini-2.5-pro",
  gemini: "gemini-2.5-pro",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
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

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supaUrl, supaKey);

    // Load provider settings
    const { data: settingsRows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["ai_search_provider", "ai_search_model"]);
    const sMap: Record<string, string> = {};
    (settingsRows || []).forEach((r: any) => { sMap[r.key] = r.value || ""; });
    const provider = (sMap.ai_search_provider || "lovable").toLowerCase();
    const model = sMap.ai_search_model || DEFAULTS[provider] || DEFAULTS.lovable;

    // Fetch candidate products
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, price, image_url, tags, short_description, category_id, rating")
      .eq("is_active", true)
      .limit(300);
    if (error) throw error;

    const catalog = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      tags: (p.tags || []).slice(0, 8),
      desc: (p.short_description || "").replace(/<[^>]+>/g, "").slice(0, 120),
    }));

    const system = `You are an empathetic gift concierge for Pikooly (flower & gift shop, Bangladesh).
Your job is to deeply understand the CUSTOMER'S FEELINGS and INTENT — no matter what language they write in.

MULTI-LANGUAGE SUPPORT (CRITICAL):
- The customer may write in ANY language or script: English, Bangla (বাংলা), Banglish (Roman Bangla), Hindi, Hinglish, Urdu, Arabic, Spanish, French, Chinese, Japanese, Korean, Russian, or anything else.
- Auto-detect the language and script of the query.
- ALWAYS write the "intent" and "reason" fields in the SAME language and script the customer used. If they mix two languages, mix them naturally.

Read between the lines to infer occasion, recipient, emotion, color hints, budget (BDT), urgency.
Then pick the 8 BEST matching products, ranked best→good.
Reply ONLY valid JSON.`;

    const user = `User query: "${query}"

Catalog (${catalog.length} items):
${JSON.stringify(catalog).slice(0, 60000)}

Return JSON (intent + reason MUST be in the same language/script as the user query):
{
  "intent": "<1 sentence in user's language>",
  "ids": ["<product id>", ...up to 8, ranked best→good],
  "reason": "<1-2 warm sentences in the user's language>"
}`;

    // ---- Call selected provider ----
    let content = "{}";
    try {
      content = await callProvider(provider, model, system, user);
    } catch (e) {
      const msg = (e as Error).message || "AI error";
      const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : msg.includes("missing key") ? 400 : 500;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    const ids: string[] = Array.isArray(parsed.ids) ? parsed.ids.filter((x: any) => typeof x === "string") : [];
    const byId = new Map((products || []).map((p) => [p.id, p]));
    const matches = ids.map((id) => byId.get(id)).filter(Boolean);

    return new Response(JSON.stringify({
      intent: parsed.intent || "",
      reason: parsed.reason || "",
      products: matches,
      provider,
      model,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callProvider(provider: string, model: string, system: string, user: string): Promise<string> {
  if (provider === "openai") {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) throw new Error("OpenAI missing key — add OPENAI_API_KEY");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j?.choices?.[0]?.message?.content || "{}";
  }

  if (provider === "anthropic") {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("Anthropic missing key — add ANTHROPIC_API_KEY");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content: user + "\n\nRespond with ONLY the JSON object, no prose." }],
      }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j?.content?.[0]?.text || "{}";
  }

  if (provider === "gemini") {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("Gemini missing key — add GEMINI_API_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  }

  // Default: Lovable AI Gateway
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("Lovable AI missing key");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) throw new Error(`Lovable ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "{}";
}
