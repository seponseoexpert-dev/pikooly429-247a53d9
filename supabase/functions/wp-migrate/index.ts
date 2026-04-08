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
    formData.append("file", imageUrl); // Cloudinary accepts remote URLs
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    const result = await response.json();

    if (response.ok && result.secure_url) {
      return result.secure_url;
    }
    console.error("Cloudinary upload failed:", result.error?.message);
    return imageUrl; // fallback to original URL
  } catch (err) {
    console.error("Cloudinary upload error:", err);
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

    const { type, uploadToCloud } = await req.json();
    const results: any = {};

    // Get Cloudinary credentials if cloud upload requested
    let cloud = { cloudName: "", apiKey: "", apiSecret: "" };
    const shouldUploadCloud = uploadToCloud === true;
    if (shouldUploadCloud) {
      cloud = await getCloudinaryCredentials(supabase);
      if (!cloud.cloudName || !cloud.apiKey || !cloud.apiSecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Cloudinary credentials not configured. Go to Admin Settings → Cloudinary." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ REMOVE ALL DATA ============
    if (type === "remove_all") {
      console.log("Removing all migrated data...");
      // Delete in order: junction tables first, then main tables
      await supabase.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("product_subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("subcategories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("blogs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      results.removed = true;
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to optionally upload image to Cloudinary
    async function maybeUpload(url: string | null, folder: string): Promise<string | null> {
      if (!url) return null;
      if (!shouldUploadCloud) return url;
      return await uploadToCloudinary(url, folder, cloud.cloudName, cloud.apiKey, cloud.apiSecret);
    }

    // ============ MIGRATE PRODUCT CATEGORIES ============
    if (type === "all" || type === "categories") {
      console.log("Fetching WooCommerce product categories...");
      const wcCats = await fetchAllPages(
        `${WP_BASE}/wp-json/wc/store/v1/products/categories`
      );
      console.log(`Found ${wcCats.length} WC categories`);

      const catMap: Record<number, string> = {};
      let order = 0;

      for (const cat of wcCats) {
        if (cat.slug === "uncategorized") continue;

        const slug = cat.slug || slugify(cat.name);
        const imageUrl = cat.image?.src || cat.image?.thumbnail || null;

        const { data: existing } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          catMap[cat.id] = existing.id;
          continue;
        }

        const uploadedImage = await maybeUpload(imageUrl, "categories");

        const { data: inserted, error } = await supabase
          .from("categories")
          .insert({
            name: cat.name,
            slug,
            description: cat.description || "",
            image_url: uploadedImage,
            is_active: true,
            show_in_homepage: true,
            show_in_header: true,
            display_order: order++,
            category_type: "category",
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Error inserting category ${cat.name}:`, error.message);
        } else {
          catMap[cat.id] = inserted.id;
        }
      }

      results.categories = { total: wcCats.length, mapped: Object.keys(catMap).length };
    }

    // ============ MIGRATE PRODUCTS (full content) ============
    if (type === "all" || type === "products") {
      console.log("Fetching WooCommerce products with full detail...");
      const wcProducts = await fetchAllPages(
        `${WP_BASE}/wp-json/wc/store/v1/products`
      );
      console.log(`Found ${wcProducts.length} WC products`);

      // Also fetch full WC REST API for rich descriptions
      let wcFullProducts: Record<string, any> = {};
      try {
        const fullProds = await fetchAllPages(
          `${WP_BASE}/wp-json/wp/v2/product?_embed`
        );
        for (const fp of fullProds) {
          wcFullProducts[fp.slug] = fp;
        }
      } catch (e) {
        console.log("Could not fetch full product details, using store API data");
      }

      const { data: dbCats } = await supabase.from("categories").select("id, slug");
      const catSlugMap: Record<string, string> = {};
      for (const c of dbCats || []) catSlugMap[c.slug] = c.id;

      let inserted = 0;
      let skipped = 0;

      for (const p of wcProducts) {
        const slug = p.slug || slugify(p.name);

        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) { skipped++; continue; }

        // Get images and upload to Cloudinary
        const images: string[] = [];
        let mainImage = null;
        if (p.images && p.images.length > 0) {
          const firstImg = p.images[0]?.src || p.images[0]?.thumbnail || null;
          mainImage = await maybeUpload(firstImg, "products");
          for (const img of p.images) {
            const imgUrl = img.src || img.thumbnail;
            if (imgUrl) {
              const uploaded = await maybeUpload(imgUrl, "products");
              if (uploaded) images.push(uploaded);
            }
          }
        }

        // Price
        const price = p.prices
          ? parseFloat(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 0)
          : 0;
        const regularPrice = p.prices
          ? parseFloat(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit || 0)
          : null;
        const originalPrice = regularPrice && regularPrice > price ? regularPrice : null;

        // Category
        let categoryId = null;
        if (p.categories && p.categories.length > 0) {
          categoryId = catSlugMap[p.categories[0]?.slug] || null;
        }
        const additionalCategoryIds: string[] = [];
        if (p.categories && p.categories.length > 1) {
          for (let i = 1; i < p.categories.length; i++) {
            const catId = catSlugMap[p.categories[i]?.slug];
            if (catId) additionalCategoryIds.push(catId);
          }
        }

        // Full HTML content - preserve formatting
        const fullProduct = wcFullProducts[slug];
        const description = fullProduct?.content?.rendered || p.description || p.short_description || "";
        const shortDesc = fullProduct?.excerpt?.rendered || p.short_description || "";

        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: p.name,
            slug,
            description: description, // Keep full HTML
            short_description: shortDesc, // Keep full HTML
            price,
            original_price: originalPrice,
            image_url: mainImage,
            images,
            category_id: categoryId,
            is_active: true,
            is_featured: p.on_sale || false,
            stock: p.quantity_limit || 100,
            rating: parseFloat(p.average_rating) || 0,
            review_count: p.review_count || 0,
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Error inserting product ${p.name}:`, error.message);
        } else {
          inserted++;
          for (const addCatId of additionalCategoryIds) {
            await supabase.from("product_categories").insert({
              product_id: newProduct.id,
              category_id: addCatId,
            });
          }
        }
      }

      results.products = { total: wcProducts.length, inserted, skipped };
    }

    // ============ MIGRATE BLOG POSTS (full HTML content) ============
    if (type === "all" || type === "blogs") {
      console.log("Fetching WordPress blog posts...");
      const wpPosts = await fetchAllPages(
        `${WP_BASE}/wp-json/wp/v2/posts?_embed`
      );
      console.log(`Found ${wpPosts.length} WP posts`);

      const wpCats = await fetchAllPages(`${WP_BASE}/wp-json/wp/v2/categories`);
      const wpCatMap: Record<number, string> = {};
      for (const c of wpCats) wpCatMap[c.id] = c.name;

      let inserted = 0;
      let skipped = 0;

      for (const post of wpPosts) {
        const slug = post.slug || slugify(post.title?.rendered || "");

        const { data: existing } = await supabase
          .from("blogs")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) { skipped++; continue; }

        // Featured image
        let imageUrl = null;
        if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
          imageUrl = post._embedded["wp:featuredmedia"][0].source_url;
        }
        imageUrl = await maybeUpload(imageUrl, "blogs");

        const catId = post.categories?.[0];
        const category = wpCatMap[catId] || "General";
        const title = post.title?.rendered?.replace(/<[^>]*>/g, "").trim() || "";
        const content = post.content?.rendered || ""; // Full HTML preserved
        const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "";

        const { error } = await supabase.from("blogs").insert({
          title,
          slug,
          content, // Full HTML
          excerpt,
          image_url: imageUrl,
          category,
          is_published: post.status === "publish",
          published_at: post.date || new Date().toISOString(),
          seo_title: title,
          seo_description: excerpt.slice(0, 160),
        });

        if (error) {
          console.error(`Error inserting blog ${title}:`, error.message);
        } else {
          inserted++;
        }
      }

      results.blogs = { total: wpPosts.length, inserted, skipped };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
