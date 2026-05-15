// AI Product Content Generator — uses Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, keywords, category, price } = await req.json();
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

    const system = `You are a senior SEO copywriter & E-E-A-T content strategist for Pikooly — a premium flower, cake & gift shop in Bangladesh. You write 100% human-sounding, emotive, original product copy in clear natural English (NEVER robotic, NEVER AI-fluff like "in today's fast-paced world", "elevate", "delve", "unleash", "in conclusion"). Content must:
- Pass AI-detector as human (varied sentence length, contractions, sensory detail, micro-stories, specific concrete nouns).
- Be optimized for Google Helpful Content + AI Overviews (SGE) + ChatGPT/Perplexity citations: include question-style sub-phrasing, direct answers in the first sentence, semantic keyword variations (LSI), entities, occasion mentions.
- Avoid any phrase that triggers "AI-generated content risk" (no "as an AI", no generic intros, no listicle filler, no keyword stuffing).
- Include 1–2 contextual internal links inside the long description using relative URLs to /shop, /shop?category=<slug>, /bouquet-builder, /events, /contact, /track-order — pick whichever is genuinely relevant.
- Use semantic HTML only: <p>, <ul>, <li>, <strong>, <a>. No <h1>/<h2>/<script>/<style>/inline styles.
Always reply with valid JSON only — no prose, no markdown fences.`;

    const user = `Write SEO-rich, 100% human-style content for this product:
- Product name: ${name}
${category ? `- Category: ${category}` : ""}
${price ? `- Price: BDT ${price}` : ""}
${keywords ? `- Focus keywords / notes: ${keywords}` : ""}

Return JSON with this EXACT shape (every field required, never empty):
{
  "slug": "<short URL slug, lowercase, hyphenated, max 60 chars, includes primary keyword>",
  "short_description": "<plain-text hook, 140-160 chars, answers 'what is this & why buy' directly>",
  "description": "<rich semantic HTML, 220-320 words. Structure: <p> opening that DIRECTLY answers what the product is and best occasions (great for AI Overviews). <p> sensory + emotional paragraph (sight, scent, feel, moment). <ul><li> 4-6 short benefit/feature bullets with <strong> on the lead phrase. <p> closing with a soft CTA + 1-2 contextual internal links like <a href=\"/shop\">explore more gifts</a> or <a href=\"/bouquet-builder\">build your own bouquet</a>. Naturally weave LSI keywords (occasion names, recipient types, Dhaka/Bangladesh, same-day delivery). NO H tags, NO emojis spam, NO AI clichés.>",
  "instructions": "<rich HTML, 60-110 words inside <ul><li> bullets. Practical care/handling/usage tips relevant to the product type (flowers: trim stems, change water; cakes: refrigerate, serve at room temp; gifts: unboxing tips). <strong> on key action verbs.>",
  "delivery_info": "<rich HTML, 50-90 words. <p> with same-day Dhaka note + nationwide next-day. <ul><li> 3-4 bullets covering delivery time slots, packaging care, contact-on-delivery, and tracking via <a href=\"/track-order\">Track Order</a>.>",
  "seo_title": "<55-60 chars, primary keyword first, includes 'Bangladesh' or 'Dhaka' or 'Pikooly' for brand cue, no clickbait>",
  "seo_description": "<150-158 chars meta description, persuasive, includes primary keyword + occasion + soft CTA like 'Order now' or 'Same-day delivery'>",
  "tags": ["8-12 lowercase semantic tags: include occasion names, recipient types, product type variations, location"]
}

Hard rules:
- NO words: "elevate, delve, unleash, leverage, embark, navigate the world, in today's, in conclusion, furthermore, moreover, it's important to note".
- Use contractions (it's, you'll, we've) for natural tone.
- Vary sentence length aggressively (mix 4-word punches with 18-word descriptive lines).
- Mention at least 2 specific occasions (birthday, anniversary, wedding, get-well, congratulations, etc.) where natural.
- Internal links MUST be inside <a href="/..."> tags within the description or delivery_info HTML.`;

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
        temperature: 0.85,
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
      slug: (parsed.slug && typeof parsed.slug === "string" ? slugify(parsed.slug) : slugify(name)),
      short_description: parsed.short_description || "",
      description: parsed.description || "",
      instructions: parsed.instructions || "",
      delivery_info: parsed.delivery_info || "",
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
