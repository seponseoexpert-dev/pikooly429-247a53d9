import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WP_BASE = "https://pikooly.com.bd";

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").trim() || "";
}

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { type } = await req.json();
    const results: any = {};

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

        // Check if category already exists
        const { data: existing } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          catMap[cat.id] = existing.id;
          continue;
        }

        const { data: inserted, error } = await supabase
          .from("categories")
          .insert({
            name: cat.name,
            slug,
            description: stripHtml(cat.description || ""),
            image_url: imageUrl,
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
      console.log("Categories done:", results.categories);
    }

    // ============ MIGRATE PRODUCTS ============
    if (type === "all" || type === "products") {
      console.log("Fetching WooCommerce products...");
      const wcProducts = await fetchAllPages(
        `${WP_BASE}/wp-json/wc/store/v1/products`
      );
      console.log(`Found ${wcProducts.length} WC products`);

      // Build category slug -> id map
      const { data: dbCats } = await supabase
        .from("categories")
        .select("id, slug");
      const catSlugMap: Record<string, string> = {};
      for (const c of dbCats || []) {
        catSlugMap[c.slug] = c.id;
      }

      let inserted = 0;
      let skipped = 0;

      for (const p of wcProducts) {
        const slug = p.slug || slugify(p.name);

        // Check if product already exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Get images
        const images: string[] = [];
        let mainImage = null;
        if (p.images && p.images.length > 0) {
          mainImage = p.images[0]?.src || p.images[0]?.thumbnail || null;
          for (const img of p.images) {
            if (img.src) images.push(img.src);
            else if (img.thumbnail) images.push(img.thumbnail);
          }
        }

        // Get price
        const price = p.prices
          ? parseFloat(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 0)
          : 0;
        const regularPrice = p.prices
          ? parseFloat(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit || 0)
          : null;
        const originalPrice = regularPrice && regularPrice > price ? regularPrice : null;

        // Get primary category
        let categoryId = null;
        if (p.categories && p.categories.length > 0) {
          const firstCatSlug = p.categories[0]?.slug;
          categoryId = catSlugMap[firstCatSlug] || null;
        }

        // Additional category mappings
        const additionalCategoryIds: string[] = [];
        if (p.categories && p.categories.length > 1) {
          for (let i = 1; i < p.categories.length; i++) {
            const catId = catSlugMap[p.categories[i]?.slug];
            if (catId) additionalCategoryIds.push(catId);
          }
        }

        const description = p.description || p.short_description || "";
        const shortDesc = p.short_description || "";

        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: p.name,
            slug,
            description: stripHtml(description),
            short_description: stripHtml(shortDesc),
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

          // Insert additional product_categories
          for (const addCatId of additionalCategoryIds) {
            await supabase.from("product_categories").insert({
              product_id: newProduct.id,
              category_id: addCatId,
            });
          }
        }
      }

      results.products = { total: wcProducts.length, inserted, skipped };
      console.log("Products done:", results.products);
    }

    // ============ MIGRATE BLOG POSTS ============
    if (type === "all" || type === "blogs") {
      console.log("Fetching WordPress blog posts...");
      const wpPosts = await fetchAllPages(
        `${WP_BASE}/wp-json/wp/v2/posts?_embed`
      );
      console.log(`Found ${wpPosts.length} WP posts`);

      // Get WP category mapping
      const wpCats = await fetchAllPages(
        `${WP_BASE}/wp-json/wp/v2/categories`
      );
      const wpCatMap: Record<number, string> = {};
      for (const c of wpCats) {
        wpCatMap[c.id] = c.name;
      }

      let inserted = 0;
      let skipped = 0;

      for (const post of wpPosts) {
        const slug = post.slug || slugify(post.title?.rendered || "");

        const { data: existing } = await supabase
          .from("blogs")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Get featured image
        let imageUrl = null;
        if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
          imageUrl = post._embedded["wp:featuredmedia"][0].source_url;
        }

        // Get category name
        const catId = post.categories?.[0];
        const category = wpCatMap[catId] || "General";

        const title = stripHtml(post.title?.rendered || "");
        const content = post.content?.rendered || "";
        const excerpt = stripHtml(post.excerpt?.rendered || "");

        const { error } = await supabase.from("blogs").insert({
          title,
          slug,
          content,
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
      console.log("Blogs done:", results.blogs);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
