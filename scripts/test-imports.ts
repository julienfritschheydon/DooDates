/**
 * Script de test des imports et wrappers de rétrocompatibilité
 */

// Test 1: Vérifier que les wrappers exportent les bonnes fonctions
async function testWrappers() {
  console.log("🔍 Test des wrappers de rétrocompatibilité...\n");

  // Test date-polls
  try {
    const datePolls = await import("../src/lib/products/date-polls");
    const required = [
      "getPolls",
      "addPoll",
      "deletePollById",
      "getPollBySlugOrId",
      "savePolls",
      "validatePoll",
      "isDatePoll",
    ];
    const missing = required.filter((fn) => typeof datePolls[fn] !== "function");

    if (missing.length > 0) {
      console.error(`❌ date-polls: Fonctions manquantes: ${missing.join(", ")}`);
      return false;
    }
    console.log("✅ date-polls: Tous les exports requis sont présents");
  } catch (error) {
    console.error("❌ Erreur lors de l'import de date-polls:", error);
    return false;
  }

  // Test form-polls
  try {
    const formPolls = await import("../src/lib/products/form-polls");
    const required = [
      "getPolls",
      "addPoll",
      "deletePollById",
      "getPollBySlugOrId",
      "savePolls",
      "validatePoll",
      "isFormPoll",
      "addFormResponse",
      "getFormResponses",
      "getFormResults",
    ];
    const missing = required.filter((fn) => typeof formPolls[fn] !== "function");

    if (missing.length > 0) {
      console.error(`❌ form-polls: Fonctions manquantes: ${missing.join(", ")}`);
      return false;
    }
    console.log("✅ form-polls: Tous les exports requis sont présents");
  } catch (error) {
    console.error("❌ Erreur lors de l'import de form-polls:", error);
    return false;
  }

  // Test quizz
  try {
    const quizz = await import("../src/lib/products/quizz");
    const required = [
      "getPolls",
      "addPoll",
      "deletePollById",
      "getPollBySlugOrId",
      "savePolls",
      "validatePoll",
      "isQuizz",
    ];
    const missing = required.filter((fn) => typeof quizz[fn] !== "function");

    if (missing.length > 0) {
      console.error(`❌ quizz: Fonctions manquantes: ${missing.join(", ")}`);
      return false;
    }
    console.log("✅ quizz: Tous les exports requis sont présents");
  } catch (error) {
    console.error("❌ Erreur lors de l'import de quizz:", error);
    return false;
  }

  // Test interface unifiée
  try {
    const products = await import("../src/lib/products");
    if (typeof products.getPollType !== "function") {
      console.error("❌ Interface unifiée: getPollType manquant");
      return false;
    }

    // Test de la fonction
    const datePoll = { type: "date" };
    const formPoll = { type: "form" };
    const quizzPoll = { type: "quizz" };

    if (products.getPollType(datePoll) !== "date") {
      console.error("❌ getPollType ne détecte pas correctement les date polls");
      return false;
    }
    if (products.getPollType(formPoll) !== "form") {
      console.error("❌ getPollType ne détecte pas correctement les form polls");
      return false;
    }
    if (products.getPollType(quizzPoll) !== "quizz") {
      console.error("❌ getPollType ne détecte pas correctement les quizz");
      return false;
    }

    console.log("✅ Interface unifiée: getPollType fonctionne correctement");
  } catch (error) {
    console.error("❌ Erreur lors de l'import de l'interface unifiée:", error);
    return false;
  }

  return true;
}

// Test 2: Vérifier que pollStorage.ts peut toujours être importé (rétrocompatibilité)
async function testPollStorageImport() {
  console.log("\n🔍 Test de l'import pollStorage.ts (rétrocompatibilité)...\n");

  try {
    const pollStorage = await import("../src/lib/pollStorage");

    // Vérifier que les fonctions principales existent
    const required = [
      "getPolls",
      "getAllPolls",
      "addPoll",
      "deletePollById",
      "getPollBySlugOrId",
      "savePolls",
    ];
    const missing = required.filter((fn) => typeof pollStorage[fn] !== "function");

    if (missing.length > 0) {
      console.error(`❌ pollStorage.ts: Fonctions manquantes: ${missing.join(", ")}`);
      return false;
    }

    console.log("✅ pollStorage.ts: Toutes les fonctions principales sont présentes");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'import de pollStorage.ts:", error);
    return false;
  }
}

// Exécuter les tests
(async () => {
  console.log("=".repeat(60));
  console.log("VÉRIFICATION DES IMPORTS ET WRAPPERS");
  console.log("=".repeat(60));
  console.log();

  const wrapperTest = await testWrappers();
  const storageTest = await testPollStorageImport();

  console.log("\n" + "=".repeat(60));
  console.log("RÉSUMÉ");
  console.log("=".repeat(60));

  if (wrapperTest && storageTest) {
    console.log("\n✅ Tous les tests sont passés !");
    console.log("✅ Les imports fonctionnent correctement");
    console.log("✅ Les wrappers de rétrocompatibilité sont valides");
    process.exit(0);
  } else {
    console.log("\n❌ Certains tests ont échoué");
    process.exit(1);
  }
})();
