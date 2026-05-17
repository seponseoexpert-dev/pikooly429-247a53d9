// AI Booking Assistant — conversational AI for Event Services & Photography/Videography.
// Uses Lovable AI Gateway (google/gemini-2.5-pro) with tool-calling to recommend packages
// and create bookings directly from chat. Loops up to 6 tool turns.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-2.5-pro";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Mode = "event" | "photo";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, messages, userId } = (await req.json()) as {
      mode: Mode;
      messages: { role: "user" | "assistant"; content: string }[];
      userId?: string | null;
    };

    if (mode !== "event" && mode !== "photo") {
      return json({ error: "Invalid mode" }, 400);
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Load catalog ----
    let catalogText = "";
    if (mode === "event") {
      const { data: cats } = await supabase
        .from("event_categories")
        .select("id, name, slug, short_description")
        .eq("is_active", true)
        .order("display_order");
      const { data: pkgs } = await supabase
        .from("event_packages")
        .select("id, category_id, name, description, price, features, is_featured")
        .eq("is_active", true)
        .order("display_order");
      catalogText = `EVENT CATEGORIES:\n${JSON.stringify(cats || [])}\n\nEVENT PACKAGES (price in BDT):\n${JSON.stringify(pkgs || []).slice(0, 40000)}`;
    } else {
      const { data: services } = await supabase
        .from("photo_services")
        .select("id, title, short_description, starting_price")
        .eq("is_active", true)
        .order("display_order");
      const { data: pkgs } = await supabase
        .from("photo_packages")
        .select("id, service_id, name, duration, price, features")
        .eq("is_active", true)
        .order("display_order");
      const { data: fees } = await supabase
        .from("photo_travel_fees")
        .select("district, fee");
      catalogText = `PHOTO/VIDEO SERVICES:\n${JSON.stringify(services || [])}\n\nPHOTO PACKAGES (BDT):\n${JSON.stringify(pkgs || []).slice(0, 30000)}\n\nTRAVEL FEES (BDT outside Dhaka):\n${JSON.stringify(fees || [])}`;
    }

    const system = mode === "event"
      ? `You are Pikooly's friendly Event Services AI concierge for Bangladesh. Help the customer plan and book an event (birthday, wedding, corporate, anniversary, etc.). All prices in BDT (৳).

Your job:
1. Greet warmly and ask what kind of event they want.
2. Understand: event type, date, guest count, budget, venue/city, special requests.
3. Recommend 1-3 best packages from the catalog using the recommend_event_packages tool.
4. Once the customer agrees on a package and shares name + phone + venue address + event date, call create_event_booking. Always read back the full details and ask for explicit confirmation ("shall I confirm your booking?") BEFORE calling create_event_booking.
5. After booking, share the booking number warmly and tell them the Pikooly team will call shortly.

Rules:
- Reply in the same language the customer uses (Bangla, English, or Banglish). Default to English if unclear.
- Keep replies short, friendly, mobile-friendly. Use bullet points & emojis sparingly.
- Never invent prices or packages — only use the catalog below.
- If catalog is empty, say packages are being updated and offer to take their contact for callback.

CATALOG:\n${catalogText}`
      : `You are Pikooly's friendly Photography & Videography AI concierge for Bangladesh. Help the customer book a photographer/videographer. All prices in BDT (৳).

Your job:
1. Greet warmly and ask what they want shot (wedding, birthday, corporate, product, pre-wedding, etc.).
2. Understand: event type, date & time, location (Dhaka or which district), duration, budget, preferences.
3. Recommend 1-3 best packages using recommend_photo_packages tool. Mention travel fee if location is outside Dhaka.
4. Once customer agrees and shares name + phone + event address + date, call create_photo_booking. Always read back full details and ask for explicit confirmation BEFORE calling create_photo_booking.
5. After booking, share the booking number and reassure them the team will call.

Rules:
- Reply in the same language the customer uses (Bangla, English, or Banglish). Default to English.
- Keep replies short, mobile-friendly, friendly. Use emojis sparingly.
- Never invent prices — only use catalog below.
- Total = package price + travel fee (0 if Dhaka).

CATALOG:\n${catalogText}`;

    const tools = mode === "event"
      ? [
          {
            type: "function",
            function: {
              name: "recommend_event_packages",
              description: "Show 1-3 recommended event packages to the customer as visual cards.",
              parameters: {
                type: "object",
                properties: {
                  package_ids: { type: "array", items: { type: "string" }, description: "UUIDs from the catalog, max 3" },
                  reason: { type: "string", description: "Short friendly explanation why these fit" },
                },
                required: ["package_ids", "reason"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_event_booking",
              description: "Create a confirmed event booking. ONLY call after customer explicitly confirms all details.",
              parameters: {
                type: "object",
                properties: {
                  package_id: { type: "string" },
                  category_id: { type: "string" },
                  customer_name: { type: "string" },
                  customer_phone: { type: "string" },
                  customer_email: { type: "string" },
                  event_date: { type: "string", description: "YYYY-MM-DD" },
                  event_time: { type: "string" },
                  venue_address: { type: "string" },
                  guest_count: { type: "number" },
                  special_requests: { type: "string" },
                  total: { type: "number", description: "Final BDT total" },
                },
                required: ["customer_name", "customer_phone", "event_date", "venue_address", "total"],
              },
            },
          },
        ]
      : [
          {
            type: "function",
            function: {
              name: "recommend_photo_packages",
              description: "Show 1-3 recommended photo/video packages to the customer as visual cards.",
              parameters: {
                type: "object",
                properties: {
                  package_ids: { type: "array", items: { type: "string" } },
                  reason: { type: "string" },
                },
                required: ["package_ids", "reason"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_photo_booking",
              description: "Create a confirmed photography booking. ONLY call after customer explicitly confirms.",
              parameters: {
                type: "object",
                properties: {
                  service_id: { type: "string" },
                  package_id: { type: "string" },
                  customer_name: { type: "string" },
                  customer_phone: { type: "string" },
                  customer_email: { type: "string" },
                  event_address: { type: "string" },
                  event_date: { type: "string", description: "YYYY-MM-DD" },
                  event_time: { type: "string" },
                  location_type: { type: "string", enum: ["dhaka", "outside_dhaka"] },
                  district: { type: "string" },
                  travel_fee: { type: "number" },
                  total: { type: "number" },
                  notes: { type: "string" },
                },
                required: ["customer_name", "customer_phone", "event_address", "event_date", "total"],
              },
            },
          },
        ];

    const chat: ChatMessage[] = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const recommendations: any[] = [];
    let booking: any = null;

    // Tool-call loop — up to 6 turns
    for (let turn = 0; turn < 6; turn++) {
      const aiRes = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: chat, tools, tool_choice: "auto" }),
      });

      if (!aiRes.ok) {
        const txt = await aiRes.text();
        const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
        return json(
          {
            error:
              status === 429
                ? "Too many requests — please wait a moment."
                : status === 402
                  ? "AI credits exhausted. Please add credits in Workspace settings."
                  : `AI error: ${txt.slice(0, 200)}`,
          },
          status,
        );
      }

      const data = await aiRes.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg) return json({ error: "Empty AI response" }, 500);

      chat.push(msg);

      const calls = msg.tool_calls || [];
      if (!calls.length) {
        return json({
          reply: msg.content || "",
          recommendations,
          booking,
        });
      }

      // Execute each tool call
      for (const call of calls) {
        const fn = call.function?.name;
        let args: any = {};
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch {}

        let result: any = { ok: true };

        if (fn === "recommend_event_packages" || fn === "recommend_photo_packages") {
          const table = fn === "recommend_event_packages" ? "event_packages" : "photo_packages";
          const ids = (args.package_ids || []).slice(0, 3);
          if (ids.length) {
            const { data: pkgs } = await supabase.from(table).select("*").in("id", ids);
            recommendations.push({ type: fn === "recommend_event_packages" ? "event" : "photo", reason: args.reason || "", packages: pkgs || [] });
            result = { ok: true, count: pkgs?.length || 0 };
          } else {
            result = { ok: false, error: "No package_ids provided" };
          }
        } else if (fn === "create_event_booking") {
          const insert = {
            user_id: userId || null,
            package_id: args.package_id || null,
            category_id: args.category_id || null,
            customer_name: args.customer_name,
            customer_phone: args.customer_phone,
            customer_email: args.customer_email || null,
            event_date: args.event_date,
            event_time: args.event_time || null,
            venue_address: args.venue_address,
            guest_count: args.guest_count || null,
            special_requests: args.special_requests || null,
            total: args.total || 0,
            status: "pending",
            payment_status: "unpaid",
            payment_method: "cod",
          };
          const { data: created, error } = await supabase
            .from("event_bookings")
            .insert(insert)
            .select("id, booking_number, total, event_date, customer_name")
            .single();
          if (error) result = { ok: false, error: error.message };
          else {
            booking = { type: "event", ...created };
            result = { ok: true, booking_number: created.booking_number, id: created.id };
          }
        } else if (fn === "create_photo_booking") {
          const insert = {
            user_id: userId || null,
            service_id: args.service_id || null,
            package_id: args.package_id || null,
            customer_name: args.customer_name,
            customer_phone: args.customer_phone,
            customer_email: args.customer_email || null,
            event_address: args.event_address,
            event_date: args.event_date,
            event_time: args.event_time || null,
            location_type: args.location_type || "dhaka",
            district: args.district || null,
            travel_fee: args.travel_fee || 0,
            total: args.total || 0,
            notes: args.notes || null,
            status: "pending",
          };
          const { data: created, error } = await supabase
            .from("photo_bookings")
            .insert(insert)
            .select("id, booking_number, total, event_date, customer_name")
            .single();
          if (error) result = { ok: false, error: error.message };
          else {
            booking = { type: "photo", ...created };
            result = { ok: true, booking_number: created.booking_number, id: created.id };
          }
        } else {
          result = { ok: false, error: `Unknown tool ${fn}` };
        }

        chat.push({
          role: "tool",
          tool_call_id: call.id,
          name: fn,
          content: JSON.stringify(result),
        });
      }
    }

    return json({ reply: "Sorry, I couldn't finish the request. Please try again.", recommendations, booking });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
