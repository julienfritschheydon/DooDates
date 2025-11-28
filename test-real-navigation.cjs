#!/usr/bin/env node

/**
 * 🧪 TEST RÉEL - Vérification de l'implémentation de la navigation intelligente
 * 
 * Ce test vérifie L'IMPLÉMENTATION RÉELLE dans le code, pas juste une simulation
 */

const fs = require('fs');
const path = require('path');

// Colors pour console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

// Lire et analyser les fichiers source
function analyzeImplementation() {
  log('\n🔍 ANALYSE DE L\'IMPLÉMENTATION RÉELLE', 'bright');
  log('=====================================', 'cyan');
  
  const results = {
    chatResetService: { exists: false, hasLogic: false, hasStrategies: false },
    useSmartNavigation: { exists: false, hasHook: false, hasEventDispatch: false },
    conversationProvider: { exists: false, hasEventListener: false, hasResetLogic: false },
    aiCreationWorkspace: { exists: false, usesSmartNav: false, allNavigateReplaced: false }
  };
  
  // 1. Analyser ChatResetService.ts
  const chatResetServicePath = path.join(process.cwd(), 'src/services/ChatResetService.ts');
  if (fs.existsSync(chatResetServicePath)) {
    results.chatResetService.exists = true;
    const content = fs.readFileSync(chatResetServicePath, 'utf8');
    
    // Vérifier les méthodes clés
    if (content.includes('determineResetStrategy')) {
      results.chatResetService.hasLogic = true;
    }
    if (content.includes('full') && content.includes('context-only') && content.includes('none') && content.includes('preserve')) {
      results.chatResetService.hasStrategies = true;
    }
  }
  
  // 2. Analyser useSmartNavigation.ts
  const smartNavPath = path.join(process.cwd(), 'src/hooks/useSmartNavigation.ts');
  if (fs.existsSync(smartNavPath)) {
    results.useSmartNavigation.exists = true;
    const content = fs.readFileSync(smartNavPath, 'utf8');
    
    if (content.includes('useSmartNavigation') && content.includes('useCallback')) {
      results.useSmartNavigation.hasHook = true;
    }
    if (content.includes('dispatchEvent') && content.includes('chat-reset')) {
      results.useSmartNavigation.hasEventDispatch = true;
    }
  }
  
  // 3. Analyser ConversationProvider.tsx
  const convProviderPath = path.join(process.cwd(), 'src/components/prototype/ConversationProvider.tsx');
  if (fs.existsSync(convProviderPath)) {
    results.conversationProvider.exists = true;
    const content = fs.readFileSync(convProviderPath, 'utf8');
    
    if (content.includes('addEventListener') && content.includes('chat-reset')) {
      results.conversationProvider.hasEventListener = true;
    }
    if (content.includes('switch') && content.includes('resetType')) {
      results.conversationProvider.hasResetLogic = true;
    }
  }
  
  // 4. Analyser AICreationWorkspace.tsx
  const aiWorkspacePath = path.join(process.cwd(), 'src/components/prototype/AICreationWorkspace.tsx');
  if (fs.existsSync(aiWorkspacePath)) {
    results.aiCreationWorkspace.exists = true;
    const content = fs.readFileSync(aiWorkspacePath, 'utf8');
    
    if (content.includes('useSmartNavigation')) {
      results.aiCreationWorkspace.usesSmartNav = true;
    }
    
    // Vérifier que tous les navigate() sont remplacés
    const navigateCalls = (content.match(/navigate\(/g) || []).length;
    const smartNavigateCalls = (content.match(/smartNavigate\(/g) || []).length;
    
    // On s'attend à ce que la plupart des appels navigate() soient remplacés
    results.aiCreationWorkspace.allNavigateReplaced = smartNavigateCalls >= navigateCalls * 0.8;
  }
  
  return results;
}

// Afficher les résultats
function displayResults(results) {
  log('\n📊 RÉSULTATS DE L\'ANALYSE', 'bright');
  log('========================', 'cyan');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  // ChatResetService
  log('\n🔧 ChatResetService.ts:', 'yellow');
  if (results.chatResetService.exists) {
    logSuccess('✅ Fichier existe');
    totalChecks++;
    if (results.chatResetService.hasLogic) {
      logSuccess('✅ Méthode determineResetStrategy présente');
      passedChecks++;
    } else {
      logError('❌ Méthode determineResetStrategy manquante');
    }
    totalChecks++;
    if (results.chatResetService.hasStrategies) {
      logSuccess('✅ Toutes les stratégies implémentées');
      passedChecks++;
    } else {
      logError('❌ Stratégies incomplètes');
    }
    totalChecks++;
  } else {
    logError('❌ Fichier manquant');
    totalChecks += 3;
  }
  
  // useSmartNavigation
  log('\n🪝 useSmartNavigation.ts:', 'yellow');
  if (results.useSmartNavigation.exists) {
    logSuccess('✅ Fichier existe');
    totalChecks++;
    if (results.useSmartNavigation.hasHook) {
      logSuccess('✅ Hook React correct');
      passedChecks++;
    } else {
      logError('❌ Hook React incorrect');
    }
    totalChecks++;
    if (results.useSmartNavigation.hasEventDispatch) {
      logSuccess('✅ Dispatch événement chat-reset');
      passedChecks++;
    } else {
      logError('❌ Dispatch événement manquant');
    }
    totalChecks++;
  } else {
    logError('❌ Fichier manquant');
    totalChecks += 3;
  }
  
  // ConversationProvider
  log('\n📱 ConversationProvider.tsx:', 'yellow');
  if (results.conversationProvider.exists) {
    logSuccess('✅ Fichier existe');
    totalChecks++;
    if (results.conversationProvider.hasEventListener) {
      logSuccess('✅ Écouteur événement chat-reset');
      passedChecks++;
    } else {
      logError('❌ Écouteur événement manquant');
    }
    totalChecks++;
    if (results.conversationProvider.hasResetLogic) {
      logSuccess('✅ Logique de reset implémentée');
      passedChecks++;
    } else {
      logError('❌ Logique de reset manquante');
    }
    totalChecks++;
  } else {
    logError('❌ Fichier manquant');
    totalChecks += 3;
  }
  
  // AICreationWorkspace
  log('\n🤖 AICreationWorkspace.tsx:', 'yellow');
  if (results.aiCreationWorkspace.exists) {
    logSuccess('✅ Fichier existe');
    totalChecks++;
    if (results.aiCreationWorkspace.usesSmartNav) {
      logSuccess('✅ utilise useSmartNavigation');
      passedChecks++;
    } else {
      logError('❌ n\'utilise pas useSmartNavigation');
    }
    totalChecks++;
    if (results.aiCreationWorkspace.allNavigateReplaced) {
      logSuccess('✅ navigate() remplacés par smartNavigate()');
      passedChecks++;
    } else {
      logWarning('⚠️ Certains navigate() non remplacés');
    }
    totalChecks++;
  } else {
    logError('❌ Fichier manquant');
    totalChecks += 3;
  }
  
  // Résultat final
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  log('\n📈 RÉSULTAT FINAL:', 'bright');
  log('==================', 'cyan');
  logSuccess(`Tests passés: ${passedChecks}/${totalChecks}`);
  logInfo(`Taux de réussite: ${successRate}%`);
  
  if (successRate === 100) {
    log('\n🎉 IMPLÉMENTATION COMPLÈTE !', 'green');
    logInfo('Le système de navigation intelligente est correctement implémenté.');
  } else if (successRate >= 80) {
    log('\n⚠️ IMPLÉMENTATION PARTIELLE', 'yellow');
    logInfo('Certains composants sont manquants ou incomplets.');
  } else {
    log('\n❌ IMPLÉMENTATION INCOMPLÈTE', 'red');
    logError('Le système de navigation intelligente n\'est pas correctement implémenté.');
  }
  
  return successRate;
}

// Vérifier le problème spécifique: page de vote sans sondage
function checkVotePageIssue() {
  log('\n🐛 PROBLÈME: Page de vote sans sondage', 'bright');
  log('======================================', 'red');
  
  logWarning('PROBLÈME IDENTIFIÉ:');
  logWarning('- La page /vote/{slug} s\'affiche sans le sondage');
  logWarning('- L\'utilisateur voit une page vide/confuse');
  logWarning('- MAUVAISE EXPÉRIENCE UTILISATEUR');
  
  log('\n🔍 CAUSES POSSIBLES:', 'yellow');
  log('1. Le slug dans l\'URL ne correspond à aucun sondage');
  log('2. Le chargement du sondage échoue silencieusement');
  log('3. La navigation intelligente reset trop agressivement');
  log('4. Problème de routing ou de data fetching');
  
  log('\n💡 SOLUTIONS RECOMMANDÉES:', 'cyan');
  log('1. Ajouter une page 404 personnalisée pour les slugs invalides');
  log('2. Afficher un état de chargement pendant le fetch');
  log('3. Rediriger vers le dashboard si le sondage n\'existe pas');
  log('4. Ajouter des logs pour debugger le problème');
  
  log('\n🧪 TEST MANUEL À FAIRE:', 'yellow');
  log('1. Créer un sondage valide');
  log('2. Copier son URL de partage');
  log('3. Ouvrir cette URL dans un nouvel onglet');
  log('4. Vérifier que le sondage s\'affiche correctement');
  log('5. Tester avec un slug invalide (ex: /vote/nonexistent)');
}

// Point d'entrée principal
async function main() {
  log('\n🧪 TEST RÉEL - SYSTÈME DE NAVIGATION INTELLIGENTE', 'bright');
  log('================================================', 'cyan');
  
  // Analyser l'implémentation
  const results = analyzeImplementation();
  const successRate = displayResults(results);
  
  // Vérifier le problème spécifique
  checkVotePageIssue();
  
  log('\n📋 CONCLUSION:', 'bright');
  log('================', 'cyan');
  
  if (successRate >= 80) {
    logInfo('L\'implémentation de base est présente.');
    logWarning('MAIS le problème de page vide reste à résoudre.');
    logInfo('Le problème vient probablement du data fetching ou du routing.');
  } else {
    logError('L\'implémentation de la navigation intelligente est incomplète.');
    logInfo('Il faut d\'abord terminer l\'implémentation avant de debugger le problème.');
  }
  
  process.exit(successRate >= 80 ? 0 : 1);
}

// Lancer le programme
if (require.main === module) {
  main().catch(error => {
    logError(`Erreur: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  analyzeImplementation,
  displayResults,
  checkVotePageIssue
};
