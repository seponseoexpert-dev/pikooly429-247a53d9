import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon-192.png", "pwa-icon-512.png"],
      manifest: {
        name: "Pikooly — Online Flower, Gift & Cake Shop",
        short_name: "Pikooly",
        description: "Order fresh flowers, beautiful gifts, and delicious cakes online in Bangladesh.",
        theme_color: "#5c6b3a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/uizdqqyiqxkcjufkksrc\.supabase\.co\/storage\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "supabase-images", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/pikooly\.com\.bd\/wp-content\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "wp-images", expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "cloudinary-images", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: /^https:\/\/static-assets-prod\.fnp\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "fnp-assets", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: /^https:\/\/encrypted-tbn0\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-images", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],
          "vendor-ui-extra": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-popover",
            "@radix-ui/react-dropdown-menu",
          ],
          "vendor-charts": ["recharts"],
          "vendor-editor": [
            "@tiptap/react",
            "@tiptap/starter-kit",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
