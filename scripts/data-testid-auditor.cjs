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

// Patterns pour détecter les boutons
const BUTTON_PATTERNS = [/<Button[^>]*onClick[^>]*>/g, /<button[^>]*onClick[^>]*>/g];

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
    console.log("🔍 Audit Data-testid en cours...\n");

    // Créer le répertoire de sortie
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Trouver tous les fichiers TSX
    const files = glob.sync(`${SRC_DIR}/**/*.tsx`);
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

  auditFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      BUTTON_PATTERNS.forEach((pattern) => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          this.stats.totalButtons++;

          if (!match[0].includes("data-testid")) {
            this.stats.missingDataTestId++;

            const issue = {
              type: "missing-data-testid",
              file: filePath,
              line: index + 1,
              content: line.trim(),
              button: match[0],
              suggestedTestId: this.generateSuggestedTestId(match[0], line, filePath),
            };

            this.issues.push(issue);

            if (this.options.verbose) {
              console.log(`❌ ${filePath}:${index + 1} - ${issue.suggestedTestId}`);
            }
          }
        }
      });
    });
  }

  generateSuggestedTestId(buttonHtml, line, filePath) {
    // Extraire le texte du bouton
    let buttonText = "";

    // Essayer différentes méthodes pour extraire le texte
    const textMatch = buttonHtml.match(/>([^<]+)</);
    if (textMatch) {
      buttonText = textMatch[1].trim();
    }

    // Nettoyer le texte du bouton
    const cleanText = buttonText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    // Stratégie de nommage
    const fileName = path.basename(filePath, ".tsx").toLowerCase();
    const componentName = fileName.replace(/page$/, "").replace(/component$/, "");

    if (cleanText) {
      return `${componentName}-${cleanText}`;
    }

    // Si pas de texte, utiliser des heuristiques simples
    if (buttonHtml.includes("navigate")) return `${componentName}-navigate`;
    if (buttonHtml.includes("submit")) return `${componentName}-submit`;
    if (buttonHtml.includes("delete")) return `${componentName}-delete`;
    if (buttonHtml.includes("edit")) return `${componentName}-edit`;
    if (buttonHtml.includes("close")) return `${componentName}-close`;

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

    // Grouper les issues par fichier
    this.issues.forEach((issue) => {
      if (!filesToFix[issue.file]) {
        filesToFix[issue.file] = [];
      }
      filesToFix[issue.file].push(issue);
    });

    // Traiter chaque fichier
    Object.entries(filesToFix).forEach(([filePath, issues]) => {
      try {
        let content = fs.readFileSync(filePath, "utf8");
        let modified = false;

        // Trier par ligne en ordre inverse pour ne pas perturber les indices
        issues.sort((a, b) => b.line - a.line);

        issues.forEach((issue) => {
          const lines = content.split("\n");
          const targetLine = lines[issue.line - 1];

          // Ajouter data-testid
          const fixedLine = targetLine.replace(
            issue.button,
            issue.button.replace(">", ` data-testid="${issue.suggestedTestId}">`),
          );

          if (fixedLine !== targetLine) {
            lines[issue.line - 1] = fixedLine;
            content = lines.join("\n");
            modified = true;
            this.stats.fixed++;

            if (this.options.verbose) {
              console.log(
                `✅ ${filePath}:${issue.line} - Ajouté data-testid="${issue.suggestedTestId}"`,
              );
            }
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
  process.exit(stats.missingDataTestId > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = DataTestIdAuditor;
