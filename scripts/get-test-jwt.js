/**
 * Script pour obtenir le JWT token de l'utilisateur de test E2E
 *
 * Usage: node scripts/get-test-jwt.js
 */

import https from "https";
import { config } from "dotenv";

// Load environment variables from .env.test or .env.local
config({ path: ".env.test" });
config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   - SUPABASE_URL or VITE_SUPABASE_URL");
  console.error("   - SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY");
  console.error("\n💡 Create a .env.test file with these variables");
  process.exit(1);
}

const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!E2E_TEST_EMAIL || !E2E_TEST_PASSWORD) {
  console.error("❌ Missing E2E test credentials:");
  console.error("   - E2E_TEST_EMAIL");
  console.error("   - E2E_TEST_PASSWORD");
  console.error("\n💡 Add these to your .env.test file");
  process.exit(1);
}

const loginData = {
  email: E2E_TEST_EMAIL,
  password: E2E_TEST_PASSWORD,
};

const postData = JSON.stringify(loginData);

const supabaseHost = new URL(SUPABASE_URL).hostname;

const options = {
  hostname: supabaseHost,
  port: 443,
  path: "/auth/v1/token?grant_type=password",
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

console.log("🔐 Récupération du JWT token pour l utilisateur E2E test...");

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(data);

      if (result.access_token) {
        console.log("✅ JWT token obtenu avec succès !");
        console.log("\n📋 Ajoute cette ligne à ton fichier .env.test :");
        console.log(`TEST_JWT=${result.access_token}`);
        console.log("\n📋 Ou ajoute cette ligne à ton fichier .env.local :");
        console.log(`TEST_JWT=${result.access_token}`);
        console.log("\n🎯 Token valide pour 1 heure (3600 secondes)");
      } else {
        console.error("❌ Erreur lors de l authentification :");
        console.error(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error("❌ Erreur de parsing JSON :", error.message);
      console.error("Response brute :", data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Erreur réseau :", error.message);
});

req.write(postData);
req.end();
