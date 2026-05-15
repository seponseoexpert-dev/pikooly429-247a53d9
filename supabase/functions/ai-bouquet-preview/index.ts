// AI Bouquet Preview — generates a preview image of the custom bouquet
// using the user-uploaded design photo + selected flowers as guidance.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { flowers, designImages } = await req.json() as {
      flowers: { name: string; qty: number }[];
      designImages: string[]; // base64 data URLs
    };

    if (!designImages?.length) {
      return new Response(JSON.stringify({ error: "At least one design image required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const flowerList = flowers?.length
      ? flowers.map((f) => `${f.qty}x ${f.name}`).join(", ")
      : "an assorted seasonal mix";

    const prompt = `Create a beautiful, professional, photorealistic preview of a hand-tied custom flower bouquet.

The bouquet contains: ${flowerList}.

Use the wrapping style, color palette, ribbon, and overall design aesthetic from the reference image(s) provided by the customer. Keep the design and wrap exactly as shown in the reference, but compose it as a finished bouquet using the flowers listed above.

Style: studio photography, soft natural lighting, clean neutral background, premium florist quality, centered composition, slight top-down angle. No text, no watermarks, no logos.`;

    // Build multimodal message with reference images
    const content: any[] = [{ type: "text", text: prompt }];
    for (const img of designImages.slice(0, 3)) {
      content.push({ type: "image_url", image_url: { url: img } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error:", resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway: ${resp.status}`);
    }

    const data = await resp.json();
    const message = data?.choices?.[0]?.message;
    const imgUrl = message?.images?.[0]?.image_url?.url
      || message?.images?.[0]?.url
      || null;

    if (!imgUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No preview image returned");
    }

    return new Response(JSON.stringify({ previewUrl: imgUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-bouquet-preview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
