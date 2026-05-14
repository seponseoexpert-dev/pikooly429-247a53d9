// AI Product Content Generator — uses Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, keywords, category, price, mode } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "Product name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an expert e-commerce copywriter for a premium flower & gift shop in Bangladesh (Pikooly). Write warm, emotive, persuasive product copy in clear English. Always reply with valid JSON only — no prose, no markdown fences.`;

    const user = `Generate SEO-optimized product content for:
- Product name: ${name}
${category ? `- Category: ${category}` : ""}
${price ? `- Price: BDT ${price}` : ""}
${keywords ? `- Keywords/notes: ${keywords}` : ""}

Return JSON with this exact shape:
{
  "short_description": "<1-2 sentence hook, max 160 chars, plain text>",
  "description": "<rich HTML, 3-4 short paragraphs wrapped in <p> tags. Include occasions, emotional benefits, what's included. May use <ul><li>. No <h1>/<h2>.>",
  "seo_title": "<max 60 chars, include keyword + brand cue>",
  "seo_description": "<max 155 chars, persuasive meta description with CTA>",
  "tags": ["6-10 lowercase tag strings, single or two-word"]
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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
      const msg = status === 429 ? "Rate limit reached. Try again shortly." :
                  status === 402 ? "AI credits exhausted. Add credits in workspace." :
                  `AI error: ${txt.slice(0, 200)}`;
      return new Response(JSON.stringify({ error: msg }), {
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

    return new Response(JSON.stringify({
      short_description: parsed.short_description || "",
      description: parsed.description || "",
      seo_title: parsed.seo_title || "",
      seo_description: parsed.seo_description || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
