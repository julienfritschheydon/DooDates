#!/usr/bin/env node

/**
 * Script de test E2E automatisé pour DooDates
 * Basé sur le scénario SCENARIO-TEST-E2E.md
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🤖 DooDates - Tests E2E Automatisés");
console.log("=====================================\n");

// Vérifier que Playwright est installé
try {
  execSync("npx playwright --version", { stdio: "pipe" });
  console.log("✅ Playwright installé");
} catch (error) {
  console.log("❌ Playwright non trouvé. Installation...");
  execSync("npm install -D @playwright/test", { stdio: "inherit" });
  execSync("npx playwright install", { stdio: "inherit" });
}

// Vérifier que le serveur de dev peut démarrer
console.log("\n📋 Vérification de l'environnement...");

try {
  // Vérifier package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  if (!packageJson.scripts["test:e2e"]) {
    console.log("❌ Script test:e2e manquant dans package.json");
    process.exit(1);
  }
  console.log("✅ Configuration package.json OK");

  // Vérifier playwright.config.ts
  if (!fs.existsSync("playwright.config.ts")) {
    console.log("❌ playwright.config.ts manquant");
    process.exit(1);
  }
  console.log("✅ Configuration Playwright OK");

  // Vérifier les fichiers de test
  const testFiles = [
    "tests/e2e/poll-creation.spec.ts",
    "tests/e2e/poll-voting.spec.ts",
    "tests/e2e/dashboard.spec.ts",
    "tests/e2e/complete-scenarios.spec.ts",
  ];

  testFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      console.log(`❌ Fichier de test manquant: ${file}`);
      process.exit(1);
    }
  });
  console.log("✅ Fichiers de tests E2E présents");
} catch (error) {
  console.log("❌ Erreur lors de la vérification:", error.message);
  process.exit(1);
}

console.log("\n🚀 Lancement des tests E2E...");
console.log("Cela peut prendre quelques minutes...\n");

try {
  // Lancer les tests avec rapport détaillé
  execSync("npx playwright test --project=chromium --reporter=html", {
    stdio: "inherit",
    timeout: 300000, // 5 minutes timeout
  });

  console.log("\n✅ Tests E2E terminés avec succès !");
  console.log("📊 Rapport disponible dans playwright-report/index.html");
} catch (error) {
  console.log("\n❌ Échec des tests E2E");
  console.log("📊 Vérifiez le rapport dans playwright-report/index.html");
  console.log("🔍 Logs d'erreur:", error.message);
  process.exit(1);
}

console.log("\n🎉 Tests automatisés DooDates terminés !");
console.log("📋 Consultez le rapport HTML pour les détails complets.");
