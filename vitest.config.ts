/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import os from "os";
import { config as loadEnv } from "dotenv";

// Charger .env.local pour les tests qui ont besoin de vraies variables d'environnement
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

export default defineConfig({
  plugins: [react()],
  define: {
    // Utiliser les vraies valeurs depuis .env.local si disponibles, sinon valeurs par défaut pour les tests
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || "https://test.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || "test-anon-key",
    ),
    // Permettre aussi VITE_GEMINI_API_KEY et VITE_USE_DIRECT_GEMINI depuis .env.local
    "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(process.env.VITE_GEMINI_API_KEY || ""),
    "import.meta.env.VITE_USE_DIRECT_GEMINI": JSON.stringify(
      process.env.VITE_USE_DIRECT_GEMINI || "false",
    ),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts", "./src/vitest.setup.d.ts"],
    globals: true,
    // Optimisations pour exécution parallèle
    pool: "threads", // Threads plus rapides que forks
    poolOptions: {
      threads: {
        singleThread: false,
        // Utiliser les CPUs disponibles (max 4, min 1)
        maxThreads: Math.min(4, os.cpus().length),
        minThreads: 1,
      },
    },
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    include: ["src/**/*.test.{ts,tsx}"],
    // Ne pas collecter les tests Playwright E2E avec Vitest
    exclude: [
      "node_modules/**",
      "tests/**",
      "src/test/gemini-professional.test.ts",
      "src/test/temporal-prompts-validation.test.ts", // Tests de validation prompts temporels (appels réels à Gemini, exclus de CI)
      "src/test/prompts-generation.test.ts", // Tests de génération de prompts (appels réels à Gemini, exclus de CI)
      "src/hooks/__tests__/useConversations.favorites.test.ts", // Tests problématiques de fallback Supabase/localStorage
    ],
    coverage: {
      provider: "v8",
      reporter: ["html", "json", "text"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
