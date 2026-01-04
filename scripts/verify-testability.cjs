#!/usr/bin/env node
/**
 * Vérification de testabilité du code
 *
 * Ce script vérifie que le nouveau code suit les bonnes pratiques:
 * 1. Les composants interactifs ont des data-testid
 * 2. Les nouvelles fonctionnalités ont des tests
 * 3. Les fichiers critiques ne sont pas modifiés sans tests
 *
 * Usage: node scripts/verify-testability.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  // Extensions de fichiers à vérifier
  sourceExtensions: [".tsx", ".ts", ".jsx", ".js"],
  testExtensions: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"],

  // Patterns pour détecter les éléments interactifs
  interactivePatterns: [
    /<button[^>]*>/gi,
    /<input[^>]*>/gi,
    /<select[^>]*>/gi,
    /<textarea[^>]*>/gi,
    /onClick\s*=/gi,
    /onChange\s*=/gi,
  ],

  // Pattern pour data-testid
  testIdPattern: /data-testid\s*=/gi,

  // Fichiers critiques qui DOIVENT avoir des tests
  criticalPatterns: [/src\/lib\//, /src\/services\//, /src\/hooks\//, /src\/components\/ui\//],

  // Fichiers à ignorer
  ignorePatterns: [
    /node_modules/,
    /dist/,
    /build/,
    /__tests__/,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/,
    /vite\.config/,
    /playwright\.config/,
    /\.config\./,
  ],
};

/**
 * Récupère les fichiers modifiés (staged)
 */
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf-8",
    });
    return output.split("\n").filter(Boolean);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des fichiers staged:", error.message);
    return [];
  }
}

/**
 * Vérifie si un fichier doit être ignoré
 */
function shouldIgnoreFile(filePath) {
  return CONFIG.ignorePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Vérifie si un fichier est un fichier source
 */
function isSourceFile(filePath) {
  return CONFIG.sourceExtensions.some((ext) => filePath.endsWith(ext));
}

/**
 * Vérifie si un fichier est critique
 */
function isCriticalFile(filePath) {
  return CONFIG.criticalPatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Vérifie si un fichier de test existe pour un fichier source
 */
function hasTestFile(sourceFilePath) {
  const dir = path.dirname(sourceFilePath);
  const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath));

  // Patterns de fichiers de test possibles
  const testPatterns = [
    // Test dans le même dossier
    path.join(dir, `${baseName}.test.ts`),
    path.join(dir, `${baseName}.test.tsx`),
    path.join(dir, `${baseName}.spec.ts`),
    path.join(dir, `${baseName}.spec.tsx`),
    // Test dans un dossier __tests__
    path.join(dir, "__tests__", `${baseName}.test.ts`),
    path.join(dir, "__tests__", `${baseName}.test.tsx`),
    path.join(dir, "__tests__", `${baseName}.spec.ts`),
    path.join(dir, "__tests__", `${baseName}.spec.tsx`),
  ];

  return testPatterns.some((testPath) => {
    try {
      return fs.existsSync(testPath);
    } catch {
      return false;
    }
  });
}

/**
 * Compte les éléments interactifs dans un fichier
 */
function countInteractiveElements(content) {
  let count = 0;
  CONFIG.interactivePatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  return count;
}

/**
 * Compte les data-testid dans un fichier
 */
function countTestIds(content) {
  const matches = content.match(CONFIG.testIdPattern);
  return matches ? matches.length : 0;
}

/**
 * Vérifie un fichier
 */
function verifyFile(filePath) {
  const issues = [];

  // Ignorer les fichiers non pertinents
  if (shouldIgnoreFile(filePath)) {
    return { filePath, issues, skipped: true };
  }

  // Vérifier seulement les fichiers source
  if (!isSourceFile(filePath)) {
    return { filePath, issues, skipped: true };
  }

  // Lire le contenu du fichier
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    issues.push({
      type: "error",
      message: `Impossible de lire le fichier: ${error.message}`,
    });
    return { filePath, issues, skipped: false };
  }

  // Vérification 1: Fichiers critiques doivent avoir des tests
  if (isCriticalFile(filePath)) {
    if (!hasTestFile(filePath)) {
      issues.push({
        type: "warning",
        message: `⚠️ Fichier critique sans tests associés`,
        suggestion: `Créer un fichier de test: ${path.basename(filePath, path.extname(filePath))}.test.ts`,
      });
    }
  }

  // Vérification 2: Composants interactifs doivent avoir data-testid
  const interactiveCount = countInteractiveElements(content);
  const testIdCount = countTestIds(content);

  if (interactiveCount > 0 && testIdCount === 0) {
    issues.push({
      type: "warning",
      message: `⚠️ ${interactiveCount} élément(s) interactif(s) sans data-testid`,
      suggestion: `Ajouter data-testid="..." aux boutons, inputs, etc.`,
    });
  } else if (interactiveCount > testIdCount * 2) {
    // Si beaucoup plus d'éléments interactifs que de testid
    issues.push({
      type: "info",
      message: `ℹ️ ${interactiveCount} éléments interactifs, ${testIdCount} data-testid`,
      suggestion: `Considérer d'ajouter plus de data-testid pour faciliter les tests`,
    });
  }

  return { filePath, issues, skipped: false };
}

/**
 * Main
 */
function main() {
  console.log("🔍 Vérification de la testabilité du code...\n");

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log("ℹ️ Aucun fichier staged à vérifier.");
    process.exit(0);
  }

  console.log(`📂 ${stagedFiles.length} fichier(s) à vérifier:\n`);

  const results = stagedFiles.map(verifyFile);

  // Filtrer les fichiers vérifiés
  const verifiedResults = results.filter((r) => !r.skipped);

  if (verifiedResults.length === 0) {
    console.log("✅ Aucun fichier source à vérifier (fichiers de config, tests, etc.)");
    process.exit(0);
  }

  // Grouper par type d'issue
  const errors = [];
  const warnings = [];
  const infos = [];

  verifiedResults.forEach((result) => {
    if (result.issues.length > 0) {
      result.issues.forEach((issue) => {
        const entry = {
          file: result.filePath,
          ...issue,
        };

        if (issue.type === "error") {
          errors.push(entry);
        } else if (issue.type === "warning") {
          warnings.push(entry);
        } else {
          infos.push(entry);
        }
      });
    }
  });

  // Afficher les résultats
  let hasIssues = false;

  if (errors.length > 0) {
    console.log("\n❌ ERREURS:\n");
    errors.forEach((err) => {
      console.log(`  📄 ${err.file}`);
      console.log(`     ${err.message}`);
      if (err.suggestion) {
        console.log(`     💡 ${err.suggestion}`);
      }
      console.log("");
    });
    hasIssues = true;
  }

  if (warnings.length > 0) {
    console.log("\n⚠️ AVERTISSEMENTS:\n");
    warnings.forEach((warn) => {
      console.log(`  📄 ${warn.file}`);
      console.log(`     ${warn.message}`);
      if (warn.suggestion) {
        console.log(`     💡 ${warn.suggestion}`);
      }
      console.log("");
    });
  }

  if (infos.length > 0) {
    console.log("\nℹ️ INFORMATIONS:\n");
    infos.forEach((info) => {
      console.log(`  📄 ${info.file}`);
      console.log(`     ${info.message}`);
      if (info.suggestion) {
        console.log(`     💡 ${info.suggestion}`);
      }
      console.log("");
    });
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log(`📊 Résumé: ${verifiedResults.length} fichier(s) vérifié(s)`);
  console.log(`   ❌ ${errors.length} erreur(s)`);
  console.log(`   ⚠️  ${warnings.length} avertissement(s)`);
  console.log(`   ℹ️  ${infos.length} info(s)`);
  console.log("=".repeat(60));

  // Si des erreurs critiques, bloquer le commit
  if (hasIssues) {
    console.log("\n❌ Des problèmes critiques ont été détectés.");
    console.log("💡 Corrigez les erreurs ci-dessus avant de commit.");
    console.log("💡 Les avertissements sont recommandés mais pas bloquants.\n");

    // Pour l'instant, on ne bloque pas le commit (exit 0)
    // Une fois la transition faite, on pourra exit 1
    console.log("⚠️ MODE PERMISSIF: Le commit est autorisé malgré les erreurs.");
    console.log("   (Sera strict après la période de transition)\n");
    process.exit(0);
  }

  if (warnings.length > 0 || infos.length > 0) {
    console.log("\n✅ Aucune erreur bloquante détectée.");
    console.log("💡 Considérez les avertissements ci-dessus pour améliorer la testabilité.\n");
  } else {
    console.log("\n✅ Tous les fichiers respectent les bonnes pratiques de testabilité!\n");
  }

  process.exit(0);
}

// Exécution
try {
  main();
} catch (error) {
  console.error("❌ Erreur inattendue:", error);
  process.exit(1);
}
