import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL pour GitHub Pages
  // En CI (tests pre-merge), on utilise '/' pour tester localement
  // En production (deploy), on utilise '/' car GitHub Pages gère le basePath automatiquement
  base: process.env.VITE_BASE_PATH || "/",

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
