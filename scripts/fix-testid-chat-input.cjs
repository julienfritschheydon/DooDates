const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger (excluant OLD/)
const filesToFix = [
  'tests/e2e/helpers/wait-helpers.ts',
  'tests/e2e/utils.ts',
  'tests/e2e/security-isolation.spec.ts',
  'tests/e2e/helpers/chat-helpers.ts',
  'tests/e2e/quota-tracking-complete.spec.ts',
  'tests/e2e/end-to-end-with-backend.spec.ts',
  'tests/e2e/fixtures.ts',
  'tests/e2e/authenticated-workflow.spec.ts'
];

function fixFile(filePath) {
  console.log(`\nTraitement de: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Remplacer message-input par chat-input
    if (content.includes('message-input')) {
      content = content.replace(/message-input/g, 'chat-input');
      changed = true;
      console.log(`  ✓ Corrigé: message-input → chat-input`);
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
console.log('🔧 Correction des data-testid dans les tests E2E...\n');

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixFile(file);
  } else {
    console.log(`⚠️  Fichier inexistant: ${file}`);
  }
});

console.log('\n✅ Terminé !');
