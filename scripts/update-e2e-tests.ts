import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Liste des fichiers à ignorer
const IGNORED_FILES = [
  'node_modules',
  '.git',
  'OLD',
  'utils',
  'global-setup.ts',
  'e2e-utils.ts'
];

// Fonction pour mettre à jour un fichier de test
function updateTestFile(filePath: string): void {
  if (IGNORED_FILES.some(ignored => filePath.includes(ignored))) {
    console.log(`⏭️  Ignoring file: ${filePath}`);
    return;
  }

  console.log(`🔄 Updating: ${filePath}`);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Vérifier si le fichier contient déjà la configuration E2E
    if (content.includes('setupAllMocks')) {
      // Mettre à jour l'import si nécessaire
      if (!content.includes("from './global-setup'")) {
        content = content.replace(
          /from ['"]\.\.?\/global-setup['"]/,
          "from './global-setup'"
        );
      }
      
      // Mettre à jour le beforeEach
      content = content.replace(
        /test\.beforeEach\(async\s*\(\s*\{\s*page\s*\}\)\s*=>\s*\{[^}]*\}/,
        "test.beforeEach(async ({ page }) => {\n    await setupAllMocks(page);"
      );
      
      // Ajouter le paramètre e2e-test aux URLs
      content = content.replace(
        /(await\s+page\.goto\(['"]\/[^'"?#]*)([\s\S]*?)(?:\)|$)/g,
        (match, p1, p2) => {
          const hasQuery = p1.includes('?');
          const hasHash = p2.includes('#');
          
          if (hasQuery) {
            // Si déjà des paramètres, ajouter e2e-test
            return `${p1}${p2.includes('e2e-test') ? '' : '&e2e-test=true'})`;
          } else if (hasHash) {
            // Si pas de paramètres mais un hash, insérer avant le hash
            return `${p1}?e2e-test=true${p2})`;
          } else {
            // Sinon, ajouter à la fin
            return `${p1}?e2e-test=true${p2})`;
          }
        }
      );
      
      // Écrire les modifications
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No update needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

// Fonction principale
function main() {
  const testFiles = [
    'tests/e2e/analytics-ai.spec.ts',
    'tests/e2e/authenticated-workflow.spec.ts',
    'tests/e2e/beta-key-activation.spec.ts',
    'tests/e2e/console-errors.spec.ts',
    'tests/e2e/dashboard-complete.spec.ts',
    'tests/e2e/dashboard-edge-cases.spec.ts',
    'tests/e2e/docs-production.spec.ts',
    'tests/e2e/docs.spec.ts',
    'tests/e2e/edge-cases.spec.ts',
    'tests/e2e/form-poll-regression.spec.ts',
    'tests/e2e/form-poll-results-access.spec.ts',
    'tests/e2e/guest-workflow.spec.ts',
    'tests/e2e/mobile-voting.spec.ts',
    'tests/e2e/poll-actions.spec.ts',
    'tests/e2e/production-smoke.spec.ts',
    'tests/e2e/security-isolation.spec.ts',
    'tests/e2e/supabase-integration.spec.ts',
    'tests/e2e/tags-folders.spec.ts',
    'tests/e2e/ultra-simple.spec.ts',
  ];

  console.log('🚀 Starting E2E test files update...');
  
  testFiles.forEach(filePath => {
    const fullPath = join(process.cwd(), filePath);
    if (existsSync(fullPath)) {
      updateTestFile(fullPath);
    } else {
      console.log(`⚠️  File not found: ${fullPath}`);
    }
  });
  
  console.log('✨ All test files have been processed!');
}

// Exécuter le script
main();
