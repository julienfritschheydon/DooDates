/**
 * Script pour extraire les tests en échec depuis test-results.json
 * Génère un rapport markdown détaillé pour GitHub Actions
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const TEST_RESULTS_PATH = path.join(process.cwd(), 'test-results.json');
const OUTPUT_PATH = path.join(process.cwd(), 'failure-report.md');

/**
 * Extrait les informations d'un test qui a échoué
 */
function extractFailureInfo(spec, test, result, browser) {
  const file = spec.file || 'Unknown file';
  const line = spec.line || 0;
  const testTitle = spec.title || 'Unknown test';
  
  return {
    browser,
    file,
    line,
    testTitle,
    duration: result.duration,
    error: result.errors?.[0]?.message || 'No error message',
    stack: result.errors?.[0]?.stack || '',
  };
}

/**
 * Parse les résultats de tests et extrait les failures
 */
function parseTestResults() {
  if (!fs.existsSync(TEST_RESULTS_PATH)) {
    console.error(`❌ Fichier ${TEST_RESULTS_PATH} introuvable`);
    return null;
  }

  const rawData = fs.readFileSync(TEST_RESULTS_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  const failures = [];
  
  // Parcourir les suites et specs
  if (data.suites) {
    data.suites.forEach(suite => {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          if (spec.tests) {
            spec.tests.forEach(test => {
              if (test.results) {
                test.results.forEach(result => {
                  if (result.status === 'failed' || result.status === 'timedOut') {
                    const browser = test.projectName || 'Unknown browser';
                    failures.push(extractFailureInfo(spec, test, result, browser));
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return {
    failures,
    stats: data.stats || {},
  };
}

/**
 * Génère un rapport markdown
 */
function generateReport(data) {
  if (!data || !data.failures) {
    return '## ✅ Tous les tests ont réussi\n\nAucun échec détecté.';
  }

  const { failures, stats } = data;

  if (failures.length === 0) {
    return '## ✅ Tous les tests ont réussi\n\nAucun échec détecté.';
  }

  let report = `## ❌ ${failures.length} Test(s) en Échec\n\n`;
  
  // Statistiques globales
  if (stats) {
    report += `### 📊 Statistiques\n\n`;
    report += `- **Total tests**: ${stats.expected || 0}\n`;
    report += `- **Tests passés**: ${stats.expected - stats.unexpected || 0}\n`;
    report += `- **Tests échoués**: ${stats.unexpected || 0}\n`;
    report += `- **Tests skippés**: ${stats.skipped || 0}\n`;
    report += `- **Tests flaky**: ${stats.flaky || 0}\n`;
    report += `- **Durée totale**: ${((stats.duration || 0) / 1000).toFixed(1)}s\n\n`;
  }

  // Grouper par fichier
  const failuresByFile = {};
  failures.forEach(failure => {
    if (!failuresByFile[failure.file]) {
      failuresByFile[failure.file] = [];
    }
    failuresByFile[failure.file].push(failure);
  });

  // Détails des échecs
  report += `### 🔍 Détails des Échecs\n\n`;

  Object.keys(failuresByFile).forEach(file => {
    const fileFailures = failuresByFile[file];
    const fileName = path.basename(file);
    
    report += `#### 📄 ${fileName}\n\n`;
    
    fileFailures.forEach((failure, index) => {
      report += `**${index + 1}. ${failure.testTitle}** \`[${failure.browser}]\`\n\n`;
      report += `- **Fichier**: \`${file}:${failure.line}\`\n`;
      report += `- **Durée**: ${failure.duration}ms\n`;
      report += `- **Erreur**:\n`;
      report += `\`\`\`\n${failure.error}\n\`\`\`\n\n`;
    });
  });

  // Grouper par navigateur pour analyse
  const failuresByBrowser = {};
  failures.forEach(failure => {
    if (!failuresByBrowser[failure.browser]) {
      failuresByBrowser[failure.browser] = [];
    }
    failuresByBrowser[failure.browser].push(failure);
  });

  report += `### 🌐 Répartition par Navigateur\n\n`;
  Object.keys(failuresByBrowser).forEach(browser => {
    const count = failuresByBrowser[browser].length;
    report += `- **${browser}**: ${count} échec(s)\n`;
  });

  // Recommandations
  report += `\n### 💡 Actions Recommandées\n\n`;
  
  // Si tous les échecs sont sur un seul navigateur
  if (Object.keys(failuresByBrowser).length === 1) {
    const browser = Object.keys(failuresByBrowser)[0];
    report += `⚠️ **Tous les échecs sont sur ${browser}**\n\n`;
    report += `Cela suggère un problème spécifique à ce navigateur:\n`;
    report += `- Vérifier les sélecteurs CSS compatibles\n`;
    report += `- Tester les timeouts (mobile souvent plus lent)\n`;
    report += `- Vérifier les interactions tactiles vs souris\n`;
    report += `- Regarder les viewport dimensions\n\n`;
  }

  // Si tests supabase-integration échouent
  const hasSupabaseFailures = failures.some(f => f.file.includes('supabase-integration'));
  if (hasSupabaseFailures) {
    report += `🔧 **Tests Supabase en échec**\n\n`;
    report += `- Vérifier que \`/diagnostic/supabase\` existe et fonctionne\n`;
    report += `- Vérifier les sélecteurs \`[data-test-status]\`\n`;
    report += `- Augmenter les timeouts pour mobile\n\n`;
  }

  // Si tests dashboard échouent
  const hasDashboardFailures = failures.some(f => f.file.includes('dashboard-complete'));
  if (hasDashboardFailures) {
    report += `📊 **Tests Dashboard en échec**\n\n`;
    report += `- Vérifier que les boutons de vue sont visibles sur mobile\n`;
    report += `- Tester les interactions tactiles\n`;
    report += `- Vérifier le responsive design\n\n`;
  }

  report += `---\n\n`;
  report += `📋 **Rapport généré automatiquement** - ${new Date().toISOString()}\n`;

  return report;
}

/**
 * Main
 */
function main() {
  console.log('🔍 Extraction des tests en échec...');
  
  const data = parseTestResults();
  
  if (!data) {
    console.error('❌ Impossible de parser les résultats de tests');
    process.exit(1);
  }

  const report = generateReport(data);
  
  // Écrire le rapport
  fs.writeFileSync(OUTPUT_PATH, report, 'utf-8');
  console.log(`✅ Rapport généré: ${OUTPUT_PATH}`);
  
  // Afficher aussi dans la console pour GitHub Actions
  console.log('\n' + report);
  
  // Exit code basé sur le nombre d'échecs
  if (data.failures && data.failures.length > 0) {
    process.exit(1); // Indiquer qu'il y a des échecs
  }
}

// Exécution
main();

