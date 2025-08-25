const { spawn } = require('child_process');
const path = require('path');

async function testSingle() {
  console.log('🚀 Test d\'un seul test E2E...\n');
  
  // Vérifier si le serveur dev tourne déjà
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :8080', (error, stdout) => {
      const serverRunning = stdout.trim().length > 0;
      
      if (!serverRunning) {
        console.log('❌ Serveur dev non démarré sur port 8080');
        console.log('📝 Démarrez d\'abord: npm run dev');
        resolve(false);
        return;
      }
      
      console.log('✅ Serveur dev détecté sur port 8080');
      
      // Lancer un seul test simple
      const testProcess = spawn('npx', [
        'playwright', 'test', 
        'tests/e2e/simple-test.spec.ts',
        '--project=chromium',
        '--reporter=line'
      ], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Test simple réussi !');
          console.log('📝 Vous pouvez maintenant lancer tous les tests avec: npm run test:e2e');
        } else {
          console.log('\n❌ Test simple échoué');
          console.log('📝 Vérifiez les erreurs ci-dessus');
        }
        resolve(code === 0);
      });
    });
  });
}

testSingle();
