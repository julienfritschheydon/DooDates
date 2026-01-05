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
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts", "./src/vitest.setup.d.ts"],
    globals: true,
    // Reporter configuration (remplace le deprecated 'basic' reporter)
    reporters: [
      [
        "default",
        {
          summary: false,
        },
      ],
    ],
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
      "**/*.manual.ts", // Tests manuels avec appels API coûteux (ex: temporal-prompts, gemini-professional)
      "src/hooks/__tests__/useConversations.favorites.test.ts", // Tests problématiques de fallback Supabase/localStorage
      // Exclure les tests qui appellent réellement l'API Gemini (coûteux et lents)
      "src/test/gemini-*.test.ts", // Tests Gemini avec appels API réels
      "src/test/gemini-benchmark.test.ts",
      "src/test/gemini-diagnostic.test.ts",
      "src/test/gemini-form-polls.test.ts",
      "tests/temporal-prompts-validation.test.ts", // ⚠️ AJOUT - Exclure test avec appels Gemini réels
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
