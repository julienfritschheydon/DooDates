#!/usr/bin/env node
/**
 * Script de vérification des imports et wrappers de rétrocompatibilité
 * Vérifie que tous les imports depuis pollStorage fonctionnent correctement
 * et que les wrappers de rétrocompatibilité sont bien en place
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const PRODUCTS_DIR = path.join(SRC_DIR, "lib", "products");

// Fonctions à vérifier dans les wrappers
const EXPECTED_EXPORTS = {
  "date-polls": [
    "getPolls",
    "addPoll",
    "deletePollById",
    "duplicatePoll",
    "getPollBySlugOrId",
    "savePolls",
    "validatePoll",
    "isDatePoll",
  ],
  "form-polls": [
    "getPolls",
    "addPoll",
    "deletePollById",
    "duplicatePoll",
    "getPollBySlugOrId",
    "savePolls",
    "validatePoll",
    "isFormPoll",
    "addFormResponse",
    "getFormResponses",
    "getFormResults",
  ],
  quizz: [
    "getPolls",
    "addPoll",
    "deletePollById",
    "duplicatePoll",
    "getPollBySlugOrId",
    "savePolls",
    "validatePoll",
  ],
};

// Types à vérifier
const EXPECTED_TYPES = {
  "date-polls": ["Poll", "PollSettings", "TimeSlot"],
  "form-polls": ["Poll", "PollSettings", "FormQuestion", "FormResponse", "FormResults"],
  quizz: ["Poll", "PollSettings"],
};

console.log("🔍 Vérification des imports et wrappers de rétrocompatibilité...\n");

let errors = [];
let warnings = [];

// Vérifier que les fichiers index.ts existent
function checkIndexFiles() {
  console.log("📁 Vérification des fichiers index.ts...");

  for (const product of Object.keys(EXPECTED_EXPORTS)) {
    const indexPath = path.join(PRODUCTS_DIR, product, "index.ts");
    if (!fs.existsSync(indexPath)) {
      errors.push(`❌ Fichier index.ts manquant pour ${product}: ${indexPath}`);
    } else {
      console.log(`  ✅ ${product}/index.ts existe`);
    }
  }
}

// Vérifier les exports dans les index.ts
function checkExports() {
  console.log("\n📦 Vérification des exports dans les wrappers...");

  for (const [product, expectedFunctions] of Object.entries(EXPECTED_EXPORTS)) {
    const indexPath = path.join(PRODUCTS_DIR, product, "index.ts");
    if (!fs.existsSync(indexPath)) continue;

    const content = fs.readFileSync(indexPath, "utf-8");
    const missing = [];

    for (const func of expectedFunctions) {
      // Vérifier si la fonction est exportée (directement ou via alias)
      const hasExport =
        content.includes(`export`) &&
        (content.includes(`${func}`) ||
          content.includes(`as ${func}`) ||
          content.includes(
            `get${product
              .split("-")
              .map((w) => w[0].toUpperCase() + w.slice(1))
              .join("")}${func.replace("get", "").replace("Poll", "")}`,
          ));

      if (!hasExport) {
        missing.push(func);
      }
    }

    if (missing.length > 0) {
      warnings.push(`⚠️  ${product}: Fonctions manquantes dans index.ts: ${missing.join(", ")}`);
    } else {
      console.log(`  ✅ ${product}: Tous les exports requis sont présents`);
    }
  }
}

// Vérifier les imports depuis pollStorage dans le code
function checkImportsFromPollStorage() {
  console.log("\n🔗 Vérification des imports depuis pollStorage...");

  const files = getAllTsFiles(SRC_DIR);
  let importCount = 0;
  let problematicImports = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(SRC_DIR, file);

    // Chercher les imports depuis pollStorage
    const importRegex = /from\s+['"]@?\.?\.?\/?.*pollStorage['"]/g;
    const matches = content.match(importRegex);

    if (matches) {
      importCount += matches.length;

      // Vérifier si le fichier utilise des fonctions qui devraient venir des services
      const usesOldFunctions =
        content.includes("getPolls") ||
        content.includes("addPoll") ||
        content.includes("deletePollById");

      if (
        usesOldFunctions &&
        !relativePath.includes("pollStorage.ts") &&
        !relativePath.includes("products")
      ) {
        // Ce n'est pas un problème si c'est dans pollStorage.ts lui-même
        // Mais on note les fichiers qui pourraient bénéficier d'une migration
        if (!problematicImports.includes(relativePath)) {
          problematicImports.push(relativePath);
        }
      }
    }
  }

  console.log(`  📊 ${importCount} imports depuis pollStorage trouvés`);

  if (problematicImports.length > 0) {
    warnings.push(
      `⚠️  Fichiers utilisant pollStorage (pourrait bénéficier d'une migration vers products/):`,
    );
    problematicImports.slice(0, 10).forEach((file) => {
      warnings.push(`     - ${file}`);
    });
    if (problematicImports.length > 10) {
      warnings.push(`     ... et ${problematicImports.length - 10} autres`);
    }
  } else {
    console.log(`  ✅ Aucun problème d'import détecté`);
  }
}

// Vérifier que les services de base existent
function checkServiceFiles() {
  console.log("\n🏗️  Vérification des fichiers de services...");

  const services = {
    "date-polls": "date-polls-service.ts",
    "form-polls": "form-polls-service.ts",
    quizz: "quizz-service.ts",
  };

  for (const [product, serviceFile] of Object.entries(services)) {
    const servicePath = path.join(PRODUCTS_DIR, product, serviceFile);
    if (!fs.existsSync(servicePath)) {
      errors.push(`❌ Fichier service manquant: ${servicePath}`);
    } else {
      console.log(`  ✅ ${product}/${serviceFile} existe`);
    }
  }
}

// Fonction utilitaire pour récupérer tous les fichiers TypeScript
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules, dist, etc.
      if (!["node_modules", "dist", ".git", ".next", "coverage"].includes(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Exécuter toutes les vérifications
try {
  checkIndexFiles();
  checkServiceFiles();
  checkExports();
  checkImportsFromPollStorage();

  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.log("\n❌ ERREURS:");
    errors.forEach((err) => console.log(`  ${err}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  AVERTISSEMENTS:");
    warnings.forEach((warn) => console.log(`  ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ Tous les imports et wrappers sont corrects !");
    process.exit(0);
  } else if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} erreur(s) trouvée(s)`);
    process.exit(1);
  } else {
    console.log(`\n⚠️  ${warnings.length} avertissement(s) trouvé(s)`);
    process.exit(0);
  }
} catch (error) {
  console.error("\n❌ Erreur lors de la vérification:", error);
  process.exit(1);
}
