import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL pour GitHub Pages
  // Détection automatique : si on est sur GitHub Pages, utiliser le nom du repo
  // Sinon, utiliser '/' pour le développement local
  base:
    process.env.VITE_BASE_PATH ||
    (() => {
      if (process.env.NODE_ENV === "production") {
        // GitHub Pages déploie automatiquement dans /repo-name/
        return "/DooDates/";
      }
      return "/";
    })(),

  server: {
    port: 8080,
    host: true, // Expose sur le réseau local
    hmr: {
      overlay: false,
    },
    // Optionnel : Ouvrir automatiquement le navigateur
    // open: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Ne pas définir 'process.env' globalement pour éviter les problèmes
    // Utiliser import.meta.env directement dans le code
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["framer-motion", "lucide-react"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "gemini-vendor": ["@google/generative-ai"],
        },
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production",
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "framer-motion",
      "lucide-react",
    ],
  },
});
