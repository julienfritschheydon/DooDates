#!/usr/bin/env node
/**
 * Tests unitaires pour l'analyseur automatique de workflows
 */

import { analyzeWorkflowFailures } from "../auto-workflow-analyzer.js";

// Tests pour l'analyseur IA
function runTests() {
  console.log("🧪 Tests de l'analyseur automatique de workflows\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Aucun échec
  console.log("Test 1: Aucun échec détecté");
  try {
    const result = analyzeWorkflowFailures([]);
    const expected = "✅ Aucun nouvel échec détecté - tout fonctionne correctement !";
    if (result.includes(expected)) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL - Résultat inattendu:", result);
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL - Erreur:", error.message);
    failed++;
  }

  // Test 2: Échec Playwright
  console.log("\nTest 2: Détection échec Playwright");
  try {
    const failures = [
      {
        id: "123",
        name: "production-smoke",
        error: "Cannot find package '@playwright/test'",
      },
    ];
    const result = analyzeWorkflowFailures(failures);

    if (
      result.includes("production-smoke") &&
      result.includes("dependencies") &&
      result.includes("Utiliser `npm install`")
    ) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL - Analyse incorrecte:", result.substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL - Erreur:", error.message);
    failed++;
  }

  // Test 3: Échec Supabase
  console.log("\nTest 3: Détection échec Supabase");
  try {
    const failures = [
      {
        id: "456",
        name: "tests-unit",
        error: "Cannot read properties of undefined (reading 'id')",
      },
    ];
    const result = analyzeWorkflowFailures(failures);

    if (result.includes("runtime") && result.includes("Ajouter vérification null/undefined")) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL - Analyse incorrecte:", result.substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL - Erreur:", error.message);
    failed++;
  }

  // Test 4: Échec critique
  console.log("\nTest 4: Classification échec critique");
  try {
    const failures = [
      {
        id: "789",
        name: "production-smoke",
        error: "Critical build failure",
      },
    ];
    const result = analyzeWorkflowFailures(failures);

    if (result.includes("Critiques : 1") && result.includes("Résoudre immédiatement")) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL - Classification incorrecte:", result.substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL - Erreur:", error.message);
    failed++;
  }

  // Test 5: Échec inconnu
  console.log("\nTest 5: Gestion échec inconnu");
  try {
    const failures = [
      {
        id: "999",
        name: "custom-workflow",
        error: "Some unknown error occurred",
      },
    ];
    const result = analyzeWorkflowFailures(failures);

    if (
      result.includes("Erreur non cataloguée") &&
      result.includes("Consulter les logs détaillés")
    ) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL - Gestion incorrecte:", result.substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log("❌ FAIL - Erreur:", error.message);
    failed++;
  }

  // Résultats
  console.log(`\n📊 Résultats des tests:`);
  console.log(`✅ ${passed} tests réussis`);
  console.log(`❌ ${failed} tests échoués`);
  console.log(`📈 Taux de succès: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log("🎉 Tous les tests passent !");
    process.exit(0);
  } else {
    console.log("⚠️ Certains tests ont échoué");
    process.exit(1);
  }
}

// Exécuter les tests si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
