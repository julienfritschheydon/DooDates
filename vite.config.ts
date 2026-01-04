import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ IMPORTANT: Base path configuration for GitHub Pages
  // This handles the /DooDates/ subdirectory deployment
  // VITE_BASE_PATH in .env.production handles React Router basename
  base: process.env.NODE_ENV === 'production' ? "/DooDates/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV === "test" ? "development" : process.env.NODE_ENV || "development",
    ),
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
    // Copier les fichiers publics pour GitHub Pages
    copyPublicDir: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    minify: "terser" as const,
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
  server: {
    port: 8080,
    host: true,
    strictPort: true, // Échoue si le port est déjà utilisé
    allowedHosts: true, // Autorise tous les hôtes (ngrok, localtunnel, etc.)
    hmr: {
      overlay: false,
    },
  },
  // Configuration spécifique pour les tests E2E
  // Utilise un port différent pour éviter les conflits
  preview: {
    port: 8081,
    host: true,
  },
});
