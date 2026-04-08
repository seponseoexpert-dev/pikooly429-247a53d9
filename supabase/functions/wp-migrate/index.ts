import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WP_BASE = "https://pikooly.com.bd";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function fetchAllPages(url: string) {
  const allItems: any[] = [];
  let page = 1;
  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}page=${page}&per_page=100`);
    if (!res.ok) break;
    const data = await res.json();
    if (!data || data.length === 0) break;
    allItems.push(...data);
    const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1");
    if (page >= totalPages) break;
    page++;
  }
  return allItems;
}

async function uploadToCloudinary(
  imageUrl: string,
  folder: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<string | null> {
  try {
    if (!imageUrl || !cloudName || !apiKey || !apiSecret) return imageUrl;
    const timestamp = Math.round(Date.now() / 1000).toString();
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    const result = await response.json();

    if (response.ok && result.secure_url) return result.secure_url;
    console.error("Cloudinary upload failed:", result.error?.message);
    return imageUrl;
  } catch (_err) {
    console.error("Cloudinary upload error:", _err);
    return imageUrl;
  }
}

async function getCloudinaryCredentials(supabase: any) {
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret"]);

  const map: Record<string, string> = {};
  settings?.forEach((s: any) => { if (s.value) map[s.key] = s.value; });

  return {
    cloudName: map["cloudinary_cloud_name"] || Deno.env.get("CLOUDINARY_CLOUD_NAME") || "",
    apiKey: map["cloudinary_api_key"] || Deno.env.get("CLOUDINARY_API_KEY") || "",
    apiSecret: map["cloudinary_api_secret"] || Deno.env.get("CLOUDINARY_API_SECRET") || "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { type, uploadToCloud, stream: useStream } = await req.json();

    // If not streaming, run legacy mode
    if (!useStream) {
      return await runLegacy(supabase, type, uploadToCloud === true);
    }

    // Streaming mode with progress
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let cloud = { cloudName: "", apiKey: "", apiSecret: "" };
          const shouldUploadCloud = uploadToCloud === true;
          if (shouldUploadCloud) {
            cloud = await getCloudinaryCredentials(supabase);
            if (!cloud.cloudName || !cloud.apiKey || !cloud.apiSecret) {
              send({ type: "error", message: "Cloudinary credentials not configured." });
              controller.close();
              return;
            }
          }

          async function maybeUpload(url: string | null, folder: string): Promise<string | null> {
            if (!url) return null;
            if (!shouldUploadCloud) return url;
            return await uploadToCloudinary(url, folder, cloud.cloudName, cloud.apiKey, cloud.apiSecret);
          }

          const results: any = {};

          // ============ REMOVE ALL ============
          if (type === "remove_all") {
            send({ type: "progress", step: "Removing all data...", percent: 10 });
            await supabase.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("product_subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            send({ type: "progress", step: "Removing products...", percent: 40 });
            await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            send({ type: "progress", step: "Removing categories & blogs...", percent: 70 });
            await supabase.from("subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("blogs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            send({ type: "progress", step: "Done!", percent: 100 });
            send({ type: "done", results: { removed: true } });
            controller.close();
            return;
          }

          // Calculate total steps
          const doCategories = type === "all" || type === "categories";
          const doProducts = type === "all" || type === "products";
          const doBlogs = type === "all" || type === "blogs";

          // ============ CATEGORIES ============
          if (doCategories) {
            send({ type: "progress", step: "Fetching categories...", percent: 5 });
            const wcCats = await fetchAllPages(`${WP_BASE}/wp-json/wc/store/v1/products/categories`);
            const catMap: Record<number, string> = {};
            let order = 0;

            for (let i = 0; i < wcCats.length; i++) {
              const cat = wcCats[i];
              if (cat.slug === "uncategorized") continue;
              const pct = doProducts ? 5 + Math.round((i / wcCats.length) * 20) : 5 + Math.round((i / wcCats.length) * 90);
              send({ type: "progress", step: `Category: ${cat.name} (${i + 1}/${wcCats.length})`, percent: pct });

              const slug = cat.slug || slugify(cat.name);
              const imageUrl = cat.image?.src || cat.image?.thumbnail || null;
              const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();

              if (existing) { catMap[cat.id] = existing.id; continue; }

              const uploadedImage = await maybeUpload(imageUrl, "categories");
              const { data: inserted, error } = await supabase.from("categories").insert({
                name: cat.name, slug, description: cat.description || "", image_url: uploadedImage,
                is_active: true, show_in_homepage: true, show_in_header: true, display_order: order++, category_type: "category",
              }).select("id").single();

              if (!error && inserted) catMap[cat.id] = inserted.id;
            }
            results.categories = { total: wcCats.length, mapped: Object.keys(catMap).length };
          }

          // ============ PRODUCTS ============
          if (doProducts) {
            send({ type: "progress", step: "Fetching products...", percent: 25 });
            const wcProducts = await fetchAllPages(`${WP_BASE}/wp-json/wc/store/v1/products`);

            let wcFullProducts: Record<string, any> = {};
            try {
              const fullProds = await fetchAllPages(`${WP_BASE}/wp-json/wp/v2/product?_embed`);
              for (const fp of fullProds) wcFullProducts[fp.slug] = fp;
            } catch (_e) { /* ignore */ }

            const { data: dbCats } = await supabase.from("categories").select("id, slug");
            const catSlugMap: Record<string, string> = {};
            for (const c of dbCats || []) catSlugMap[c.slug] = c.id;

            let inserted = 0, skipped = 0;

            for (let i = 0; i < wcProducts.length; i++) {
              const p = wcProducts[i];
              const pct = doBlogs ? 30 + Math.round((i / wcProducts.length) * 40) : 30 + Math.round((i / wcProducts.length) * 65);
              send({ type: "progress", step: `Product: ${p.name} (${i + 1}/${wcProducts.length})`, percent: pct });

              const slug = p.slug || slugify(p.name);
              const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
              if (existing) { skipped++; continue; }

              const images: string[] = [];
              let mainImage = null;
              if (p.images?.length > 0) {
                mainImage = await maybeUpload(p.images[0]?.src || p.images[0]?.thumbnail, "products");
                for (const img of p.images) {
                  const imgUrl = img.src || img.thumbnail;
                  if (imgUrl) { const u = await maybeUpload(imgUrl, "products"); if (u) images.push(u); }
                }
              }

              const price = p.prices ? parseFloat(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 0) : 0;
              const regularPrice = p.prices ? parseFloat(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit || 0) : null;
              const originalPrice = regularPrice && regularPrice > price ? regularPrice : null;

              let categoryId = null;
              if (p.categories?.length > 0) categoryId = catSlugMap[p.categories[0]?.slug] || null;
              const additionalCategoryIds: string[] = [];
              if (p.categories?.length > 1) {
                for (let j = 1; j < p.categories.length; j++) {
                  const cid = catSlugMap[p.categories[j]?.slug];
                  if (cid) additionalCategoryIds.push(cid);
                }
              }

              const fullProduct = wcFullProducts[slug];
              const description = fullProduct?.content?.rendered || p.description || p.short_description || "";
              const shortDesc = fullProduct?.excerpt?.rendered || p.short_description || "";

              const { data: newProduct, error } = await supabase.from("products").insert({
                name: p.name, slug, description, short_description: shortDesc, price, original_price: originalPrice,
                image_url: mainImage, images, category_id: categoryId, is_active: true,
                is_featured: p.on_sale || false, stock: p.quantity_limit || 100,
                rating: parseFloat(p.average_rating) || 0, review_count: p.review_count || 0,
              }).select("id").single();

              if (!error && newProduct) {
                inserted++;
                for (const addCatId of additionalCategoryIds) {
                  await supabase.from("product_categories").insert({ product_id: newProduct.id, category_id: addCatId });
                }
              }
            }
            results.products = { total: wcProducts.length, inserted, skipped };
          }

          // ============ BLOGS ============
          if (doBlogs) {
            send({ type: "progress", step: "Fetching blog posts...", percent: 75 });
            const wpPosts = await fetchAllPages(`${WP_BASE}/wp-json/wp/v2/posts?_embed`);
            const wpCats = await fetchAllPages(`${WP_BASE}/wp-json/wp/v2/categories`);
            const wpCatMap: Record<number, string> = {};
            for (const c of wpCats) wpCatMap[c.id] = c.name;

            let inserted = 0, skipped = 0;

            for (let i = 0; i < wpPosts.length; i++) {
              const post = wpPosts[i];
              const pct = 78 + Math.round((i / wpPosts.length) * 20);
              send({ type: "progress", step: `Blog: ${(post.title?.rendered || "").replace(/<[^>]*>/g, "").slice(0, 40)} (${i + 1}/${wpPosts.length})`, percent: pct });

              const slug = post.slug || slugify(post.title?.rendered || "");
              const { data: existing } = await supabase.from("blogs").select("id").eq("slug", slug).maybeSingle();
              if (existing) { skipped++; continue; }

              let imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
              imageUrl = await maybeUpload(imageUrl, "blogs");

              const catId = post.categories?.[0];
              const category = wpCatMap[catId] || "General";
              const title = post.title?.rendered?.replace(/<[^>]*>/g, "").trim() || "";
              const content = post.content?.rendered || "";
              const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "";

              const { error } = await supabase.from("blogs").insert({
                title, slug, content, excerpt, image_url: imageUrl, category,
                is_published: post.status === "publish", published_at: post.date || new Date().toISOString(),
                seo_title: title, seo_description: excerpt.slice(0, 160),
              });

              if (!error) inserted++;
            }
            results.blogs = { total: wpPosts.length, inserted, skipped };
          }

          send({ type: "progress", step: "Migration complete!", percent: 100 });
          send({ type: "done", results });
        } catch (err: any) {
          send({ type: "error", message: err.message });
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Legacy non-streaming handler
async function runLegacy(supabase: any, type: string, shouldUploadCloud: boolean) {
  const results: any = {};
  let cloud = { cloudName: "", apiKey: "", apiSecret: "" };

  if (shouldUploadCloud) {
    cloud = await getCloudinaryCredentials(supabase);
    if (!cloud.cloudName || !cloud.apiKey || !cloud.apiSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Cloudinary credentials not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  async function maybeUpload(url: string | null, folder: string): Promise<string | null> {
    if (!url) return null;
    if (!shouldUploadCloud) return url;
    return await uploadToCloudinary(url, folder, cloud.cloudName, cloud.apiKey, cloud.apiSecret);
  }

  if (type === "remove_all") {
    await supabase.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("product_subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("blogs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return new Response(JSON.stringify({ success: true, results: { removed: true } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Simplified legacy - just return success to use streaming instead
  return new Response(JSON.stringify({ success: true, results: { message: "Use streaming mode for progress" } }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
