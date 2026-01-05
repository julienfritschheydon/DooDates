// Setup des tests Jest
import * as dotenv from "dotenv";

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: ".env.local" });

// Configuration des timeouts pour les tests Gemini
if (typeof jest !== "undefined") {
  jest.setTimeout(30000);
}

// Variables d'environnement pour les tests
process.env.NODE_ENV = "test";

// Mock des console.log pour les tests sauf erreurs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Configuration pour les tests asynchrones
if (typeof global !== "undefined") {
  global.setTimeout = setTimeout;
}

// Polyfill pour import.meta.env (Vite) dans Jest
if (typeof global !== "undefined") {
  // @ts-ignore
  global.import = global.import || {};
  // @ts-ignore
  global.import.meta = global.import.meta || {};
  // @ts-ignore
  global.import.meta.env = {
    DEV: process.env.NODE_ENV === "development",
    PROD: process.env.NODE_ENV === "production",
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  };
}
