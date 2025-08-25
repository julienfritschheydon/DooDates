const { spawn } = require('child_process');

async function runTests() {
  console.log('🚀 Lancement des tests E2E ultra-simple...\n');
  
  return new Promise((resolve) => {
    const testProcess = spawn('npx', [
      'playwright', 'test', 
      'tests/e2e/ultra-simple.spec.ts',
      '--project=chromium',
      '--reporter=line'
    ], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Tous les tests sont passés !');
        console.log('📝 Le workflow E2E fonctionne complètement');
      } else {
        console.log('\n❌ Certains tests ont échoué');
        console.log('📝 Vérifiez les erreurs ci-dessus');
      }
      resolve(code === 0);
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Erreur lors du lancement des tests:', error.message);
      resolve(false);
    });
  });
}

runTests();
