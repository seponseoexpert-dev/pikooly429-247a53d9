// AI Blog Generator — Bangladesh-targeted, semantic SEO, human-style
import { callAI } from "../_shared/ai-call.ts";

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
    const { topic, keywords, category, tone } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are a senior SEO + E-E-A-T content strategist for **Pikooly** — a premium flower, cake & gift e-commerce brand in **Bangladesh** (Dhaka, Chattogram, Sylhet, nationwide delivery). You write 100% human-sounding, original blog posts in clear natural English that:

- Read as 0% AI-detected: varied sentence length, contractions, sensory details, micro-stories, concrete nouns, occasional first-person ("we", "our team"), real Bangladesh context (Boishakh, Pohela Falgun, Eid, Victory Day, local areas like Gulshan/Dhanmondi/Banani).
- Score 100+ on readability (Flesch): short sentences, simple words, active voice, conversational.
- Are optimized for **Google Helpful Content + AI Overviews (SGE) + ChatGPT/Perplexity citations**: direct answer in opening, question-style H2/H3 subheadings, semantic keyword variations (LSI), named entities, FAQs, lists, tables when useful.
- Use **semantic SEO** — primary keyword + related entities + synonyms naturally woven. NO keyword stuffing. Google must see topical authority, not risk.
- Include **2-4 manual safe internal links** using ONLY these relative URLs (NEVER external/unknown URLs): /shop, /shop?category=flowers, /shop?category=cakes, /shop?category=gifts, /bouquet-builder, /events, /blog, /contact, /track-order, /about-us. Each link must be genuinely contextual.
- Use only semantic HTML: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>, <table>, <thead>, <tbody>, <tr>, <th>, <td>. NO <h1>, NO <script>, NO <style>, NO inline styles, NO emoji-spam.
- Add 1-2 [caption]...[/caption] highlighted quote blocks inside content where a key insight appears.
- BANNED phrases (never use): "elevate", "delve", "unleash", "leverage", "embark", "in today's fast-paced world", "in conclusion", "furthermore", "moreover", "as an AI", "navigate the world of", "tapestry", "realm", "landscape of".

Reply with VALID JSON ONLY. No prose, no markdown fences.`;

    const user = `Write a complete blog post for Pikooly Bangladesh.

- Topic: ${topic}
${category ? `- Category: ${category}` : ""}
${keywords ? `- Focus keywords (use semantically, not stuffed): ${keywords}` : ""}
${tone ? `- Tone: ${tone}` : "- Tone: warm, knowledgeable, locally-rooted Bangladeshi"}

Return JSON with this EXACT shape (every field required, never empty):
{
  "title": "<compelling 50-65 char blog title, primary keyword near front, includes Bangladesh context if natural>",
  "slug": "<short URL slug, lowercase, hyphenated, max 60 chars, primary keyword>",
  "excerpt": "<plain text hook, 140-160 chars, directly answers the topic & sparks curiosity>",
  "content": "<RICH SEMANTIC HTML, 800-1200 words. Structure: opening <p> (direct answer in first 2 lines), 4-6 <h2> question-style subheadings, each with 2-3 <p> + at least one <ul>/<ol>/<table>, 2-4 manual internal <a href='/shop'> style links, 1-2 [caption]Key insight here[/caption] blocks, closing <h2>FAQ</h2> with 3-4 Q&A in <h3>+<p>>",
  "seo_title": "<55-60 chars, primary keyword first, brand 'Pikooly' or 'Bangladesh' at end>",
  "seo_description": "<150-158 chars meta description, primary keyword + benefit + soft CTA>",
  "tags": ["8-12 lowercase semantic tags including bangla terms where natural"]
}

Hard rules:
- Internal links MUST be from this exact safe whitelist only: /shop, /shop?category=flowers, /shop?category=cakes, /shop?category=gifts, /bouquet-builder, /events, /blog, /contact, /track-order, /about-us.
- Use contractions, vary sentence length (mix 5-word + 20-word sentences), mention 2+ real Bangladesh occasions or cities.
- Do NOT invent product names or prices.
- Do NOT use <h1>.`;

    let content = "{}";
    try {
      content = await callAI({ system, user, json: true, temperature: 0.85, maxTokens: 4000 });
    } catch (e) {
      const msg = (e as Error).message || "AI error";
      const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : msg.includes("not configured") ? 400 : 500;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    // Strip any non-whitelisted hrefs as a safety net
    const safeHosts = ["/shop", "/bouquet-builder", "/events", "/blog", "/contact", "/track-order", "/about-us"];
    let html: string = parsed.content || "";
    html = html.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, txt) => {
      const ok = safeHosts.some((h) => href.startsWith(h));
      return ok ? m : txt; // strip link, keep text
    });
    // Remove script/style/h1 just in case
    html = html.replace(/<\/?h1[^>]*>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");

    return new Response(JSON.stringify({
      title: parsed.title || topic,
      slug: parsed.slug && typeof parsed.slug === "string" ? slugify(parsed.slug) : slugify(parsed.title || topic),
      excerpt: parsed.excerpt || "",
      content: html,
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
