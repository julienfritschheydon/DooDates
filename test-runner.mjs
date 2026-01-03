#!/usr/bin/env node

import { createVitest } from "vitest/node";

async function runTestsWithMonitoring(testPattern) {
  console.log(`🧪 Démarrage des tests pour: ${testPattern}`);

  // Créer l'instance Vitest
  const vitest = await createVitest("test", {
    watch: false,
    reporters: ["verbose"],
    silent: false,
  });

  // S'abonner aux événements de fin de tests
  vitest.onTestsRerun(() => {
    console.log("🔄 Tests en cours d'exécution...");
  });

  // Démarrer les tests
  try {
    await vitest.init();

    // Collecter les fichiers de test
    const specs = await vitest.globTestSpecifications([testPattern]);
    console.log(`📁 ${specs.length} fichier(s) de test trouvé(s)`);

    // Exécuter les tests
    console.log("⚡ Exécution des tests...");
    await vitest.runTestSpecifications(specs);

    // Attendre un peu pour que les résultats soient disponibles
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log("✅ Tests terminés!");

    // Afficher les résultats finaux
    const state = vitest.state;
    const passed = state.getPassed?.() || 0;
    const failed = state.getFailed?.() || 0;
    const skipped = state.getSkipped?.() || 0;

    console.log(`\n📊 Résultats:`);
    console.log(`   - Tests passés: ${passed}`);
    console.log(`   - Tests échoués: ${failed}`);
    console.log(`   - Tests ignorés: ${skipped}`);
    console.log(`   - Total: ${passed + failed + skipped}`);

    // Fermer proprement
    await vitest.close();

    // Sortir avec le bon code
    const failedCount = state.getFailed?.() || 0;
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution des tests:", error);
    await vitest.close();
    process.exit(1);
  }
}

// Récupérer le pattern des arguments
const testPattern = process.argv[2] || "**/*.test.{ts,tsx}";

runTestsWithMonitoring(testPattern).catch(console.error);
