/**
 * Script pour extraire les métriques de performance des tests E2E Playwright
 * et les formater pour l'envoi à Supabase
 * 
 * Usage:
 *   node scripts/extract-e2e-metrics.js --input test-results.json --output e2e-metrics.json
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const outputIndex = args.indexOf('--output');

if (inputIndex === -1) {
  console.error('Usage: node extract-e2e-metrics.js --input <test-results.json> [--output <e2e-metrics.json>]');
  process.exit(1);
}

const inputFile = args[inputIndex + 1];
const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'e2e-metrics.json';

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

// Read test results
const testResults = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Extract performance metrics from test results
const metrics = {
  timestamp: new Date().toISOString(),
  source: 'e2e',
  
  // Dashboard load times
  dashboard_load_50_conversations: extractMetric(testResults, 'dashboard.*50.*conversations?', 'duration'),
  dashboard_load_200_conversations: extractMetric(testResults, 'dashboard.*200.*conversations?', 'duration'),
  
  // Menu interactions
  tags_menu_open: extractMetric(testResults, 'tags.*menu.*open', 'duration'),
  folders_menu_open: extractMetric(testResults, 'folders.*menu.*open', 'duration'),
  
  // Product-specific dashboards
  date_dashboard_load: extractMetric(testResults, 'date.*dashboard.*load', 'duration'),
  form_dashboard_load: extractMetric(testResults, 'form.*dashboard.*load', 'duration'),
  availability_dashboard_load: extractMetric(testResults, 'availability.*dashboard.*load', 'duration'),
  quizz_dashboard_load: extractMetric(testResults, 'quizz.*dashboard.*load', 'duration'),
};

// Remove null values
Object.keys(metrics).forEach(key => {
  if (metrics[key] === null) {
    delete metrics[key];
  }
});

// Write output
fs.writeFileSync(outputFile, JSON.stringify(metrics, null, 2));

console.log('✅ Métriques E2E extraites avec succès!');
console.log(`📊 Fichier de sortie: ${outputFile}`);
console.log('\n📈 Métriques extraites:');
Object.entries(metrics).forEach(([key, value]) => {
  if (key !== 'timestamp' && key !== 'source') {
    console.log(`   ${key}: ${value}ms`);
  }
});

/**
 * Extrait une métrique des résultats de tests
 */
function extractMetric(results, testNamePattern, metricType = 'duration') {
  try {
    const pattern = new RegExp(testNamePattern, 'i');
    
    // Chercher dans les suites de tests
    if (results.suites) {
      for (const suite of results.suites) {
        const metric = searchInSuite(suite, pattern, metricType);
        if (metric !== null) return metric;
      }
    }
    
    // Chercher dans les tests directs
    if (results.tests) {
      for (const test of results.tests) {
        if (pattern.test(test.title || test.name)) {
          return extractDuration(test, metricType);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Erreur lors de l'extraction de ${testNamePattern}:`, error.message);
    return null;
  }
}

/**
 * Recherche récursive dans une suite de tests
 */
function searchInSuite(suite, pattern, metricType) {
  // Chercher dans les tests de cette suite
  if (suite.tests) {
    for (const test of suite.tests) {
      if (pattern.test(test.title || test.name)) {
        return extractDuration(test, metricType);
      }
    }
  }
  
  // Chercher dans les sous-suites
  if (suite.suites) {
    for (const subSuite of suite.suites) {
      const metric = searchInSuite(subSuite, pattern, metricType);
      if (metric !== null) return metric;
    }
  }
  
  return null;
}

/**
 * Extrait la durée d'un test
 */
function extractDuration(test, metricType) {
  // Playwright test results format
  if (test.duration !== undefined) {
    return Math.round(test.duration);
  }
  
  // Custom performance measurements
  if (test.measurements && test.measurements[metricType]) {
    return Math.round(test.measurements[metricType]);
  }
  
  // Results array format
  if (test.results && test.results.length > 0) {
    const result = test.results[0];
    if (result.duration !== undefined) {
      return Math.round(result.duration);
    }
  }
  
  return null;
}

