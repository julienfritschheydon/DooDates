#!/usr/bin/env node

/**
 * Pre-commit hook pour vérifier la configuration critique E2E
 * Empêche les commits qui cassent les tests E2E en CI
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration E2E critique...');

// Vérifications critiques
const checks = [
  {
    name: 'NODE_ENV dans start-e2e-server.cjs',
    file: 'scripts/start-e2e-server.cjs',
    pattern: /NODE_ENV:\s*['"]development['"]/g,
    required: true,
    message: '❌ NODE_ENV=development manquant dans start-e2e-server.cjs'
  },
  {
    name: 'NODE_ENV=development dans workflows CI',
    files: ['.github/workflows/*.yml'],
    pattern: /NODE_ENV=development/g,
    required: true,
    message: '❌ NODE_ENV=development manquant dans les workflows CI'
  },
  {
    name: 'Documentation E2E NODE_ENV',
    file: 'Docs/ARCHITECTURE/E2E-NODE_ENV-CONFIGURATION.md',
    pattern: /NODE_ENV=development/g,
    required: true,
    message: '❌ Documentation E2E-NODE_ENV-CONFIGURATION.md manquante'
  },
  {
    name: 'CI Debug test file',
    file: 'tests/e2e/ci-debug-chat-input.spec.ts',
    pattern: /CI Debug.*Chat Input/g,
    required: true,
    message: '❌ Test CI debug manquant - essentiel pour diagnostiquer les problèmes CI'
  }
];

let allPassed = true;

for (const check of checks) {
  try {
    if (check.files) {
      // Vérification multiple fichiers
      let foundMatches = 0;
      let checkedFiles = 0;
      
      for (const filePattern of check.files) {
        const glob = require('glob');
        const files = glob.sync(filePattern);
        
        for (const file of files) {
          checkedFiles++;
          const filePath = path.join(process.cwd(), file);
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(check.pattern);
          
          if (matches && matches.length > 0) {
            foundMatches += matches.length;
          }
        }
      }
      
      if (check.required && foundMatches === 0) {
        console.log(check.message);
        console.log(`   📂 Fichiers vérifiés: ${check.files.join(', ')}`);
        allPassed = false;
      } else if (foundMatches > 0) {
        console.log(`✅ ${check.name}: ${foundMatches} occurrence(s) trouvée(s) dans ${checkedFiles} fichier(s)`);
      } else {
        console.log(`⚠️ ${check.name}: Non requis mais ${checkedFiles} fichier(s) vérifié(s)`);
      }
    } else {
      // Vérification fichier unique
      const filePath = path.join(process.cwd(), check.file);
      
      if (!fs.existsSync(filePath)) {
        if (check.required) {
          console.log(`❌ Fichier manquant: ${check.file}`);
          allPassed = false;
        }
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(check.pattern);
      
      if (check.required && (!matches || matches.length === 0)) {
        console.log(check.message);
        allPassed = false;
      } else if (matches && matches.length > 0) {
        console.log(`✅ ${check.name}: ${matches.length} occurrence(s) trouvée(s)`);
      } else {
        console.log(`⚠️ ${check.name}: Non requis mais vérifié`);
      }
    }
  } catch (error) {
    console.log(`❌ Erreur vérification ${check.name}: ${error.message}`);
    allPassed = false;
  }
}

// Vérification supplémentaire : s'assurer qu'il n'y a pas NODE_ENV=production dans les fichiers critiques
const productionChecks = [
  {
    name: 'Pas de NODE_ENV=production dans start-e2e-server.cjs',
    file: 'scripts/start-e2e-server.cjs',
    pattern: /NODE_ENV:\s*['"]production['"]/g,
    required: false,
    message: '❌ NODE_ENV=production détecté dans start-e2e-server.cjs - cela cassera les E2E!'
  },
  {
    name: 'Pas de NODE_ENV=production dans les workflows CI',
    files: ['.github/workflows/*.yml'],
    pattern: /CI Debug.*NODE_ENV=production/g,
    required: false,
    message: '❌ NODE_ENV=production détecté dans les workflows CI debug - cela cassera les E2E!'
  }
];

for (const check of productionChecks) {
  try {
    if (check.files) {
      // Vérification multiple fichiers
      let foundMatches = 0;
      let checkedFiles = 0;
      
      for (const filePattern of check.files) {
        const glob = require('glob');
        const files = glob.sync(filePattern);
        
        for (const file of files) {
          checkedFiles++;
          const filePath = path.join(process.cwd(), file);
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(check.pattern);
          
          if (matches && matches.length > 0) {
            foundMatches += matches.length;
          }
        }
      }
      
      if (foundMatches > 0) {
        console.log(check.message);
        console.log(`   📍 Trouvé dans: ${check.files.join(', ')}`);
        allPassed = false;
      }
    } else {
      // Vérification fichier unique
      const filePath = path.join(process.cwd(), check.file);
      
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(check.pattern);
      
      if (matches && matches.length > 0) {
        console.log(check.message);
        console.log(`   📍 Trouvé dans: ${check.file}`);
        allPassed = false;
      }
    }
  } catch (error) {
    console.log(`❌ Erreur vérification ${check.name}: ${error.message}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('✅ Toutes les vérifications E2E critiques sont passées');
  console.log('🚀 Les tests E2E devraient fonctionner en CI');
  process.exit(0);
} else {
  console.log('\n❌ ÉCHEC DES VÉRIFICATIONS E2E CRITIQUES');
  console.log('⚠️ Ce commit va probablement casser les tests E2E en CI');
  console.log('📝 Veuillez corriger les problèmes ci-dessus avant de commiter');
  console.log('');
  console.log('💡 Pour contourner (non recommandé):');
  console.log('   git commit --no-verify');
  process.exit(1);
}
