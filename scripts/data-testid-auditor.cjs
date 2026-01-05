#!/usr/bin/env node

/**
 * Data-testid Auditor - Outil complet d'audit des data-testid
 * Version CommonJS pour compatibilité
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Configuration
const SRC_DIR = "src";
const OUTPUT_DIR = "scripts/reports";

// Patterns pour détecter les boutons (balises ouvrantes uniquement)
// On capture tout ce qui ressemble à une balise ouvrante Button ou button, potentiellement sur plusieurs lignes
const BUTTON_PATTERNS = [/<Button([\s\S]*?)>/g, /<button([\s\S]*?)>/g];

class DataTestIdAuditor {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      verbose: options.verbose || false,
      outputDir: options.outputDir || OUTPUT_DIR,
      ...options,
    };
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      totalButtons: 0,
      missingDataTestId: 0,
      inconsistentNames: 0,
      fixed: 0,
    };
  }

  audit() {
    console.log("🔍 Audit Data-testid en cours (Version améliorée)...\n");

    // Créer le répertoire de sortie
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Trouver tous les fichiers TSX et TS
    let files = glob.sync(`${SRC_DIR}/**/*.{tsx,ts}`);

    // Filtrage si option passée
    if (this.options.files) {
      const filterList = this.options.files.split(",").map(f => f.trim().replace(/\\/g, "/"));
      files = files.filter(file => {
        const normalizedFile = file.replace(/\\/g, "/");
        return filterList.some(filter => normalizedFile.includes(filter));
      });
      console.log(`🎯 Mode filtré : ${files.length} fichiers conservés.`);
    }

    this.stats.totalFiles = files.length;

    files.forEach((file) => {
      this.auditFile(file);
    });

    this.generateReport();
    this.displaySummary();

    if (this.options.fix && this.issues.length > 0) {
      this.fixIssues();
    }

    return this.stats;
  }

  // Trouve la fin d'une balise ouvrante JSX en respectant les accolades et les guillemets
  findOpeningTagEnd(content, startIndex) {
    let inQuotes = false;
    let quoteType = null;
    let braceLevel = 0;

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (inQuotes) {
        if (char === quoteType && content[i - 1] !== "\\") {
          inQuotes = false;
        }
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inQuotes = true;
        quoteType = char;
        continue;
      }

      if (char === "{") {
        braceLevel++;
        continue;
      }

      if (char === "}") {
        braceLevel--;
        continue;
      }

      if (char === ">" && braceLevel === 0) {
        return i;
      }
    }
    return -1;
  }

  auditFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const START_PATTERNS = [/<Button\b/g, /<button\b/g];

    START_PATTERNS.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const index = match.index;
        const endIndex = this.findOpeningTagEnd(content, index);

        if (endIndex === -1) continue;

        const buttonHtml = content.substring(index, endIndex + 1);

        // On ignore si c'est déjà un data-testid ou si c'est commenté (basique)
        if (buttonHtml.includes("data-testid")) {
          this.stats.totalButtons++;
          continue;
        }

        this.stats.totalButtons++;
        this.stats.missingDataTestId++;

        // Calculer le numéro de ligne
        const lineNumber = content.substring(0, index).split("\n").length;

        const issue = {
          type: "missing-data-testid",
          file: filePath,
          line: lineNumber,
          index: index,
          content: buttonHtml.split("\n")[0].trim() + "...",
          button: buttonHtml,
          suggestedTestId: this.generateSuggestedTestId(buttonHtml, content, index, filePath),
        };

        this.issues.push(issue);

        if (this.options.verbose) {
          console.log(`❌ ${filePath}:${lineNumber} - ${issue.suggestedTestId}`);
        }
      }
    });
  }

  generateSuggestedTestId(buttonHtml, fullContent, matchIndex, filePath) {
    // 1. Essayer d'extraire le texte après la balise ouvrante
    let buttonText = "";
    const contentAfterButton = fullContent.substring(matchIndex + buttonHtml.length);
    const textMatch = contentAfterButton.match(/^\s*([^<>\n{]+)/);
    if (textMatch) {
      buttonText = textMatch[1].trim();
    }

    // 2. Si pas de texte direct, chercher un ID ou un label Lucide ou un contenu JSX
    if (!buttonText) {
      const idMatch = buttonHtml.match(/id=["']([^"']+)["']/);
      if (idMatch) buttonText = idMatch[1];
    }

    // Nettoyer le texte du bouton
    const cleanText = buttonText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    // Stratégie de nommage basée sur le nom du fichier
    const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
    const componentName = fileName
      .replace(/page$/, "")
      .replace(/component$/, "")
      .replace(/content$/, "");

    if (cleanText) {
      return `${componentName}-${cleanText}`;
    }

    // Heuristiques basées sur le contenu de la balise
    if (buttonHtml.includes("navigate")) return `${componentName}-navigate`;
    if (buttonHtml.includes("submit")) return `${componentName}-submit`;
    if (buttonHtml.includes("delete")) return `${componentName}-delete`;
    if (buttonHtml.includes("edit")) return `${componentName}-edit`;
    if (buttonHtml.includes("close") || buttonHtml.includes("<X")) return `${componentName}-close`;
    if (buttonHtml.includes("ArrowLeft") || buttonHtml.includes("back"))
      return `${componentName}-back`;
    if (buttonHtml.includes("Download")) return `${componentName}-download`;
    if (buttonHtml.includes("Save") || buttonHtml.includes("save")) return `${componentName}-save`;
    if (buttonHtml.includes("Refresh") || buttonHtml.includes("refresh"))
      return `${componentName}-refresh`;

    return `${componentName}-button`;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.stats,
      issues: this.issues,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = path.join(this.options.outputDir, `data-testid-audit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Rapport détaillé généré : ${reportPath}`);
  }

  fixIssues() {
    console.log("\n🔧 Tentative de correction automatique...\n");

    const filesToFix = {};
    let fixCount = 0;
    const limit = this.options.limit ? parseInt(this.options.limit) : Infinity;

    // Grouper les issues par fichier
    for (const issue of this.issues) {
      if (fixCount >= limit) break;

      if (!filesToFix[issue.file]) {
        filesToFix[issue.file] = [];
      }
      filesToFix[issue.file].push(issue);
      fixCount++;
    }

    // Traiter chaque fichier
    Object.entries(filesToFix).forEach(([filePath, issues]) => {
      try {
        let content = fs.readFileSync(filePath, "utf8");
        let modified = false;

        // Trier par index en ordre inverse pour ne pas perturber les positions
        issues.sort((a, b) => b.index - a.index);

        issues.forEach((issue) => {
          // Vérifier que le contenu à cet index correspond toujours au bouton
          const currentContent = content.substring(issue.index, issue.index + issue.button.length);

          if (currentContent === issue.button) {
            // Insérer le data-testid avant la fermeture de la balise ouvrante
            // On insère juste avant le dernier '>'
            const fixedButton = issue.button.slice(0, -1) + ` data-testid="${issue.suggestedTestId}">`;

            content = content.substring(0, issue.index) +
              fixedButton +
              content.substring(issue.index + issue.button.length);

            modified = true;
            this.stats.fixed++;

            if (this.options.verbose) {
              console.log(
                `✅ ${filePath}:${issue.line} - Ajouté data-testid="${issue.suggestedTestId}"`,
              );
            }
          } else {
            console.warn(`⚠️  Mismatch à ${filePath}:${issue.line}. Le contenu a changé.`);
          }
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          console.log(`📝 ${filePath} - ${issues.length} correction(s) appliquée(s)`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
      }
    });

    console.log(`\n🎯 ${this.stats.fixed} correction(s) appliquée(s)`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.stats.missingDataTestId > 0) {
      recommendations.push({
        type: "missing-data-testid",
        priority: "high",
        message: `${this.stats.missingDataTestId} boutons sans data-testid détectés`,
        action: "Ajouter des data-testid pour préparer le multilingue",
      });
    }

    return recommendations;
  }

  displaySummary() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 RÉSUMÉ DE L'AUDIT");
    console.log("=".repeat(50));
    console.log(`📁 Fichiers analysés : ${this.stats.totalFiles}`);
    console.log(`🔘 Boutons trouvés : ${this.stats.totalButtons}`);
    console.log(`❌ Sans data-testid : ${this.stats.missingDataTestId}`);
    console.log(`✅ Avec data-testid : ${this.stats.totalButtons - this.stats.missingDataTestId}`);

    const coverage = (
      ((this.stats.totalButtons - this.stats.missingDataTestId) / this.stats.totalButtons) *
      100
    ).toFixed(1);
    console.log(`📈 Taux de couverture : ${coverage}%`);

    if (this.stats.missingDataTestId === 0) {
      console.log("\n🎉 Parfait ! Tous les boutons ont un data-testid !");
    } else {
      console.log(`\n⚠️  ${this.stats.missingDataTestId} boutons nécessitent une attention`);
    }

    console.log("=".repeat(50));
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parser les arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--fix":
        options.fix = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--files":
        options.files = args[++i];
        break;
      case "--limit":
        options.limit = args[++i];
        break;
      case "--help":
        console.log(`
Data-testid Auditor - Outil d'audit des data-testid

Usage: node scripts/data-testid-auditor.cjs [options]

Options:
  --fix         Tente de corriger automatiquement les problèmes
  --verbose      Affiche les détails pendant l'audit
  --output DIR   Spécifie le répertoire de sortie des rapports
  --help         Affiche cette aide

Exemples:
  node scripts/data-testid-auditor.cjs
  node scripts/data-testid-auditor.cjs --fix --verbose
  node scripts/data-testid-auditor.cjs --output ./custom-reports
        `);
        process.exit(0);
    }
  }

  const auditor = new DataTestIdAuditor(options);
  const stats = auditor.audit();

  // Exit code basé sur les résultats
  // Si --fix est activé, on retourne 0 si tout a été corrigé
  if (options.fix) {
    process.exit(stats.missingDataTestId === stats.fixed ? 0 : 1);
  } else {
    process.exit(stats.missingDataTestId > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataTestIdAuditor;
