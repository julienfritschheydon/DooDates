#!/usr/bin/env node

/**
 * Script de validation des règles et bonnes pratiques pour les tests E2E
 * Vérifie que les tests respectent les règles définies dans Docs/TESTS/-Tests-Guide.md
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Mapping des textes connus vers leurs data-testid correspondants
const KNOWN_TEXT_TO_TESTID = {
  Envoyer: "send-message-button",
  Copier: "copy-button", // Exemple, à adapter selon les vrais data-testid
};

const RULES = {
  NO_WAIT_FOR_TIMEOUT: {
    name: "Ne JAMAIS utiliser waitForTimeout() avec des valeurs fixes",
    pattern: /\.waitForTimeout\s*\(\s*\d+\s*\)/g,
    message:
      "Utilisez waitForElementReady, waitForReactStable ou autres helpers d'attente conditionnelle",
    severity: "error",
  },
  NO_SILENT_CATCH: {
    name: "Ne JAMAIS utiliser .catch() silencieux",
    patterns: [
      // .catch(() => {}) - catch vide
      /\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/g,
      // .catch(() => false) - catch qui retourne false
      /\.catch\s*\(\s*\(\)\s*=>\s*false\s*\)/g,
      // .catch(() => null) - catch qui retourne null
      /\.catch\s*\(\s*\(\)\s*=>\s*null\s*\)/g,
      // .catch(() => undefined) - catch qui retourne undefined
      /\.catch\s*\(\s*\(\)\s*=>\s*undefined\s*\)/g,
    ],
    message: "Utilisez safeClick, safeIsVisible ou autres helpers safe* avec logging explicite",
    severity: "error",
  },
  USE_CENTRALIZED_TIMEOUTS: {
    name: "Utiliser la configuration centralisée des timeouts",
    pattern: /timeout:\s*\d+/g,
    message: "Utilisez getTimeouts(browserName) depuis config/timeouts.ts",
    severity: "warning",
    excludeFiles: ["config/timeouts.ts", "helpers/wait-helpers.ts"], // Fichiers où c'est normal
    // Note: Cette règle est en warning car elle nécessite une migration progressive
  },
  PREFER_DATA_TESTID_OVER_HAS_TEXT: {
    name: "Préférer data-testid plutôt que has-text() pour les éléments avec data-testid connu",
    pattern: /has-text\s*\(\s*["']([^"']+)["']\s*\)/gi,
    message: 'Utilisez [data-testid="..."] au lieu de has-text() quand un data-testid existe',
    severity: "warning",
    // Cette règle nécessite une vérification spéciale pour voir si le texte correspond à un data-testid connu
    checkMatch: function (match, content, index) {
      const text = match[1]; // Le texte entre guillemets
      const testId = KNOWN_TEXT_TO_TESTID[text];

      if (!testId) {
        return null; // Pas de data-testid connu pour ce texte, ignorer
      }

      // Toujours suggérer l'utilisation du data-testid si on connaît le mapping
      return {
        text: text,
        suggestedTestId: testId,
      };
    },
  },
};

const TEST_DIR = path.join(__dirname, "../../tests/e2e");
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /helpers\/wait-helpers\.ts$/, // Helpers d'attente sont autorisés à utiliser waitForTimeout
  /helpers\/safe-helpers\.ts$/, // Helpers safe peuvent utiliser catch
  /helpers\/auth-helpers\.ts$/, // Helpers d'authentification peuvent utiliser waitForTimeout pour la stabilité
  /config\/timeouts\.ts$/, // Fichier de config des timeouts
  /Docs\//, // Ignorer les fichiers de documentation
  /\.md$/, // Ignorer les fichiers markdown
  /\/OLD\//i, // Ignorer les dossiers OLD (anciens tests)
  /\/old\//i, // Ignorer les dossiers old (anciens tests)
  /\/deprecated\//i, // Ignorer les dossiers deprecated
  /\/archive\//i, // Ignorer les dossiers archive
];

function getAllTestFiles(dir = TEST_DIR) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Répertoire de tests non trouvé: ${dir}`);
    return files;
  }

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Vérifier les patterns d'exclusion
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
        continue;
      }

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        // Exclure les helpers, config, fixtures et dossiers d'anciens fichiers
        const normalizedRelativePath = relativePath.replace(/\\/g, "/");
        const isExcluded =
          normalizedRelativePath.includes("helpers/") ||
          normalizedRelativePath.includes("config/") ||
          normalizedRelativePath.includes("fixtures") ||
          normalizedRelativePath.includes("utils.ts") ||
          /\/OLD\//i.test(normalizedRelativePath) ||
          /\/old\//i.test(normalizedRelativePath) ||
          /\/deprecated\//i.test(normalizedRelativePath) ||
          /\/archive\//i.test(normalizedRelativePath);
        if (!isExcluded) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dir);
  return files;
}

function isInComment(content, index) {
  const beforeMatch = content.substring(0, index);
  const lines = beforeMatch.split("\n");
  const currentLine = lines[lines.length - 1];

  // Vérifier si on est dans un commentaire de ligne
  const lineCommentIndex = currentLine.indexOf("//");
  if (lineCommentIndex !== -1 && lineCommentIndex < index - beforeMatch.lastIndexOf("\n")) {
    return true;
  }

  // Vérifier si on est dans un commentaire de bloc
  const lastBlockCommentStart = beforeMatch.lastIndexOf("/*");
  const lastBlockCommentEnd = beforeMatch.lastIndexOf("*/");
  if (lastBlockCommentStart !== -1 && lastBlockCommentStart > lastBlockCommentEnd) {
    return true;
  }

  return false;
}

function checkFile(filePath, rule) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);
  const normalizedPath = relativePath.replace(/\\/g, "/"); // Normaliser les séparateurs de chemin
  const violations = [];

  // Vérifier les exclusions pour cette règle
  if (rule.excludeFiles) {
    if (rule.excludeFiles.some((exclude) => normalizedPath.includes(exclude))) {
      return violations;
    }
  }

  // Vérifier les patterns d'exclusion globaux (helpers, config, etc.)
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(normalizedPath))) {
    return violations;
  }

  // Exclure tous les fichiers dans helpers/, config/, fixtures et dossiers d'anciens fichiers
  if (
    normalizedPath.includes("helpers/") ||
    normalizedPath.includes("config/") ||
    normalizedPath.includes("fixtures") ||
    /\/OLD\//i.test(normalizedPath) ||
    /\/old\//i.test(normalizedPath) ||
    /\/deprecated\//i.test(normalizedPath) ||
    /\/archive\//i.test(normalizedPath)
  ) {
    return violations;
  }

  // Vérifier les patterns
  const patterns = Array.isArray(rule.pattern) ? rule.pattern : [rule.pattern];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      const lineContent = content.split("\n")[lineNumber - 1].trim();

      // Ignorer les commentaires
      if (isInComment(content, match.index)) {
        continue;
      }

      // Ignorer les lignes qui sont uniquement des commentaires
      if (
        lineContent.startsWith("//") ||
        lineContent.startsWith("*") ||
        lineContent.startsWith("/**")
      ) {
        continue;
      }

      // Vérifier les exclusions spécifiques à la règle
      if (rule.excludePattern && rule.excludePattern.test(lineContent)) {
        continue;
      }

      // Pour .catch(), vérifier que c'est vraiment .catch() et pas autre chose
      if (rule.name.includes(".catch()")) {
        // Le match doit commencer par .catch
        if (!match[0].startsWith(".catch")) {
          continue;
        }

        const beforeMatch = content.substring(Math.max(0, match.index - 200), match.index);
        const afterMatch = content.substring(
          match.index,
          Math.min(content.length, match.index + 50),
        );
        const fullContext = beforeMatch + match[0] + afterMatch;

        // Ignorer si c'est dans un import ou une déclaration de type
        if (
          /import.*from|type\s+\w+|interface\s+\w+|const\s+\{[^}]*error[^}]*\}/.test(fullContext)
        ) {
          continue;
        }

        // Ignorer si c'est dans un commentaire de documentation
        if (/\/\*|\*\/|\/\/.*catch/i.test(fullContext)) {
          continue;
        }

        // Vérifier qu'il y a bien une promesse avant (await, .then, etc.)
        // Le pattern doit être précédé d'une méthode de promesse
        const hasPromiseBefore =
          /await|\.then|\.finally|Promise\.|new Promise|\.click|\.fill|\.isVisible|\.waitFor|\.evaluate|\.goto|expect\(|\.reload|\.navigate/.test(
            beforeMatch,
          );
        if (!hasPromiseBefore) {
          continue; // Probablement pas une promesse de test
        }
      }

      // Pour les timeouts, ignorer si c'est dans une chaîne de caractères (documentation)
      if (rule.name.includes("timeout")) {
        const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
        if (beforeMatch.includes("`") || beforeMatch.includes("'") || beforeMatch.includes('"')) {
          const quoteCount = (beforeMatch.match(/`/g) || []).length;
          if (quoteCount % 2 !== 0) {
            continue; // Dans une chaîne template
          }
        }
      }

      // Pour la règle PREFER_DATA_TESTID_OVER_HAS_TEXT, utiliser la fonction checkMatch
      if (rule.checkMatch) {
        const checkResult = rule.checkMatch(match, content, match.index);
        if (!checkResult) {
          continue; // Pas de violation détectée
        }

        // Ajouter des informations supplémentaires à la violation
        violations.push({
          file: relativePath,
          line: lineNumber,
          content: lineContent,
          match: match[0],
          suggestion: `Utilisez [data-testid="${checkResult.suggestedTestId}"] au lieu de has-text("${checkResult.text}")`,
        });
        continue;
      }

      violations.push({
        file: relativePath,
        line: lineNumber,
        content: lineContent,
        match: match[0],
      });
    }
  }

  return violations;
}

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .filter((line) => line.trim())
      .filter((line) => {
        // Ne garder que les fichiers de test E2E
        const isTestFile =
          line.includes("tests/e2e") && (line.endsWith(".ts") || line.endsWith(".js"));
        // Exclure les helpers, config, fixtures et dossiers d'anciens fichiers
        const normalizedLine = line.replace(/\\/g, "/");
        const isExcluded =
          normalizedLine.includes("helpers/") ||
          normalizedLine.includes("config/") ||
          normalizedLine.includes("fixtures") ||
          /\/OLD\//i.test(normalizedLine) ||
          /\/old\//i.test(normalizedLine) ||
          /\/deprecated\//i.test(normalizedLine) ||
          /\/archive\//i.test(normalizedLine);
        return isTestFile && !isExcluded;
      })
      .map((file) => path.join(process.cwd(), file))
      .filter((file) => fs.existsSync(file));
  } catch (error) {
    return [];
  }
}

function main() {
  console.log("🔍 Validation des règles E2E...\n");

  // Mode: vérifier seulement les fichiers staged ou tous les fichiers
  const checkStagedOnly = process.argv.includes("--staged");
  const filesToCheck = checkStagedOnly ? getStagedFiles() : getAllTestFiles();

  if (filesToCheck.length === 0) {
    if (checkStagedOnly) {
      console.log("ℹ️  Aucun fichier de test E2E modifié dans ce commit");
      return 0;
    } else {
      console.log("⚠️  Aucun fichier de test trouvé");
      return 0;
    }
  }

  console.log(`📁 Vérification de ${filesToCheck.length} fichier(s)...\n`);

  const allViolations = {
    error: [],
    warning: [],
  };

  // Vérifier chaque règle
  for (const [ruleKey, rule] of Object.entries(RULES)) {
    const ruleViolations = [];

    for (const filePath of filesToCheck) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const violations = checkFile(filePath, rule);
      ruleViolations.push(...violations);
    }

    if (ruleViolations.length > 0) {
      const icon = rule.severity === "error" ? "❌" : "⚠️";
      console.log(
        `${icon} ${rule.name} (${rule.severity === "error" ? "BLOQUANT" : "Avertissement"})`,
      );
      console.log(`   ${rule.message}\n`);

      // Limiter l'affichage pour éviter trop de sortie
      const maxViolationsToShow = 10;
      const violationsToShow = ruleViolations.slice(0, maxViolationsToShow);

      // Grouper par fichier
      const byFile = {};
      for (const violation of violationsToShow) {
        if (!byFile[violation.file]) {
          byFile[violation.file] = [];
        }
        byFile[violation.file].push(violation);
      }

      for (const [file, violations] of Object.entries(byFile)) {
        console.log(`   📄 ${file}:`);
        for (const violation of violations) {
          let output = `      Ligne ${violation.line}: ${violation.content.substring(0, 80)}${violation.content.length > 80 ? "..." : ""}`;
          if (violation.suggestion) {
            output += `\n         💡 ${violation.suggestion}`;
          }
          console.log(output);
        }
        console.log("");
      }

      if (ruleViolations.length > maxViolationsToShow) {
        console.log(
          `   ... et ${ruleViolations.length - maxViolationsToShow} autre(s) violation(s)\n`,
        );
      }

      allViolations[rule.severity].push(...ruleViolations);
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  const totalErrors = allViolations.error.length;
  const totalWarnings = allViolations.warning.length;

  if (totalErrors > 0) {
    console.log(`❌ ${totalErrors} violation(s) CRITIQUE(s) détectée(s)`);
    console.log("\n💡 Consultez Docs/TESTS/-Tests-Guide.md pour les bonnes pratiques");
    return 1;
  } else if (totalWarnings > 0) {
    console.log(`⚠️  ${totalWarnings} avertissement(s) détecté(s) (non bloquant)`);
    return 0;
  } else {
    console.log("✅ Toutes les règles E2E sont respectées");
    return 0;
  }
}

const exitCode = main();
process.exit(exitCode);
