import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { config as loadEnv } from "dotenv";

// Charger .env.local avant la config
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || "https://test.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || "test-anon-key",
    ),
    "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(process.env.VITE_GEMINI_API_KEY || ""),
    "import.meta.env.VITE_USE_DIRECT_GEMINI": '"true"',
    "import.meta.env.VITE_DISABLE_POST_PROCESSING": JSON.stringify(
      process.env.VITE_DISABLE_POST_PROCESSING || "false",
    ),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    testTimeout: 120000, // 2 minutes par test (appels Gemini lents)
    hookTimeout: 30000,
    include: [
      // ✅ FICHIER CONSOLIDÉ PRINCIPAL (fusionné avec gemini-date-polls.test.ts)
      "src/test/gemini-tests.manual.ts", // ~70 tests consolidés avec filtrage et scoring sur 4 points
      // Autres tests
      "src/test/gemini-tests/*.manual.ts",
      "src/test/gemini-tests/*.test.ts",
      "src/test/gemini-form-polls.test.ts", // 10 tests de formulaires
      "src/test/prompts-generation.manual.ts",
      "src/test/prompts-generation.test.ts",
    ],
    exclude: ["node_modules/**", "tests/**"],
    // Exécuter les tests séquentiellement pour éviter le rate limiting
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Reporter verbose pour voir les détails
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
