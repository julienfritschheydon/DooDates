#!/usr/bin/env node

/**
 * Script pour détecter les boutons sans data-testid
 * Usage : node scripts/check-missing-data-testids.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SRC_DIR = 'src';
const PATTERNS = [
  /<Button[^>]*onClick[^>]*>/g,
  /<button[^>]*onClick[^>]*>/g
];

function findButtonsWithoutDataTestid(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const missing = [];

  lines.forEach((line, index) => {
    PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Vérifier si le bouton a déjà un data-testid
          if (!match.includes('data-testid')) {
            missing.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
              button: match
            });
          }
        });
      }
    });
  });

  return missing;
}

function main() {
  console.log('🔍 Recherche des boutons sans data-testid...\n');

  // Trouver tous les fichiers TSX
  const files = glob.sync(`${SRC_DIR}/**/*.tsx`);
  
  let totalMissing = 0;
  const allMissing = [];

  files.forEach(file => {
    const missing = findButtonsWithoutDataTestid(file);
    if (missing.length > 0) {
      allMissing.push(...missing);
      totalMissing += missing.length;
    }
  });

  // Afficher les résultats
  if (allMissing.length === 0) {
    console.log('✅ Tous les boutons ont un data-testid !');
    process.exit(0);
  }

  console.log(`❌ ${totalMissing} bouton(s) trouvé(s) sans data-testid :\n`);

  // Grouper par fichier
  const byFile = {};
  allMissing.forEach(item => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });

  // Afficher par fichier
  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`📁 ${file}`);
    items.forEach(item => {
      console.log(`   Line ${item.line}: ${item.content}`);
      console.log(`   Bouton: ${item.button}`);
      console.log('');
    });
  });

  // Générer un rapport JSON
  const report = {
    timestamp: new Date().toISOString(),
    total: totalMissing,
    files: byFile,
    summary: {
      totalFiles: Object.keys(byFile).length,
      mostAffectedFile: Object.entries(byFile).reduce((a, b) => a[1].length > b[1].length ? a : b)[0]
    }
  };

  fs.writeFileSync('missing-data-testids-report.json', JSON.stringify(report, null, 2));
  console.log(`📊 Rapport généré : missing-data-testids-report.json`);

  process.exit(1); // Exit code 1 pour indiquer des problèmes
}

if (require.main === module) {
  main();
}

module.exports = { findButtonsWithoutDataTestid };
