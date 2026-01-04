import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }): UserConfig => {
  const config = {
    plugins: [react()],
    base: "/",  // Développement = "/"
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
      hmr: {
        overlay: false,
      },
    },
  };

  // ⚠️ CRITIQUE: GitHub Pages routing - Configuration finale corrigée
  // En production (build): base="/DooDates/" pour GitHub Pages
  // En développement (serve): base="/" pour tester en local
  // BrowserRouter SANS basename dans les deux cas
  if (command !== "serve") {
    config.base = "/DooDates/";
  }

  return config;
});
