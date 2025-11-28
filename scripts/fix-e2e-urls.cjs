const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger (excluant OLD/)
const filesToFix = [
  'tests/e2e/analytics-ai-optimized.spec.ts',
  'tests/e2e/authenticated-workflow.spec.ts',
  'tests/e2e/availability-poll-workflow.spec.ts',
  'tests/e2e/beta-key-activation.spec.ts',
  'tests/e2e/console-errors.spec.ts',
  'tests/e2e/dashboard-complete.spec.ts',
  'tests/e2e/dashboard-edge-cases.spec.ts',
  'tests/e2e/docs-production.spec.ts',
  'tests/e2e/docs.spec.ts',
  'tests/e2e/end-to-end-with-backend.spec.ts',
  'tests/e2e/form-poll-date-question.spec.ts',
  'tests/e2e/form-poll-results-access.spec.ts',
  'tests/e2e/guest-quota.spec.ts',
  'tests/e2e/mobile-drag-drop.spec.ts',
  'tests/e2e/mobile-voting.spec.ts',
  'tests/e2e/production-smoke.spec.ts',
  'tests/e2e/quota-tracking-complete.spec.ts',
  'tests/e2e/security-isolation.spec.ts',
  'tests/e2e/supabase-integration.spec.ts',
  'tests/e2e/tags-folders.spec.ts',
  'tests/e2e/ultra-simple-form.spec.ts',
  'tests/e2e/ultra-simple-poll.spec.ts'
];

// Mapping des URLs à corriger
const urlMappings = {
  // Racine
  "goto('/',": "goto('/DooDates/',",
  "goto('/')": "goto('/DooDates/')",
  
  // Dashboard
  "goto('/dashboard'": "goto('/DooDates/dashboard'",
  "goto('/dashboard')": "goto('/DooDates/dashboard')",
  "goto('/dashboard/journal'": "goto('/DooDates/dashboard/journal'",
  "goto('/dashboard/journal')": "goto('/DooDates/dashboard/journal')",
  
  // Workspace
  "goto('/workspace'": "goto('/DooDates/workspace'",
  "goto('/workspace')": "goto('/DooDates/workspace')",
  "goto('/workspace?": "goto('/DooDates/workspace?",
  
  // Create
  "goto('/create'": "goto('/DooDates/create'",
  "goto('/create')": "goto('/DooDates/create')",
  "goto('/create/ai'": "goto('/DooDates/create/ai'",
  "goto('/create/availability'": "goto('/DooDates/create/availability'",
  "goto('/create/date'": "goto('/DooDates/create/date'",
  "goto('/create/form'": "goto('/DooDates/create/form'",
  
  // Docs (certains sont déjà corrigés)
  "goto('/docs'": "goto('/DooDates/docs'",
  "goto('/docs')": "goto('/DooDates/docs')",
  
  // Diagnostic
  "goto('/diagnostic'": "goto('/DooDates/diagnostic'",
  "goto('/diagnostic')": "goto('/DooDates/diagnostic')"
};

function fixFile(filePath) {
  console.log(`\nTraitement de: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Appliquer toutes les corrections
    for (const [oldUrl, newUrl] of Object.entries(urlMappings)) {
      if (content.includes(oldUrl)) {
        const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newUrl);
        changed = true;
        console.log(`  ✓ Corrigé: ${oldUrl} → ${newUrl}`);
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Fichier mis à jour`);
    } else {
      console.log(`  ℹ️  Aucune correction nécessaire`);
    }
    
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
  }
}

// Traiter tous les fichiers
console.log('🔧 Correction des URLs dans les tests E2E...\n');

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixFile(file);
  } else {
    console.log(`⚠️  Fichier inexistant: ${file}`);
  }
});

console.log('\n✅ Terminé !');
