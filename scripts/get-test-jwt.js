/**
 * Script pour obtenir le JWT token de l'utilisateur de test E2E
 * 
 * Usage: node scripts/get-test-jwt.js
 */

import https from 'https';

const SUPABASE_URL = 'https://outmbbisrrdiumlweira.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dG1iYmlzcnJkaXVtbHdlaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTg1MDUsImV4cCI6MjA3Nzk5NDUwNX0.xeD_7_klSNzfX_5OU2p_vxFSwhrhQvqzi1b6RM-N-Ts';

const loginData = {
  email: 'e2e-test@doodates.com',
  password: 'E2E-Test-123'
};

const postData = JSON.stringify(loginData);

const options = {
  hostname: 'outmbbisrrdiumlweira.supabase.co',
  port: 443,
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'apikey': ANON_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔐 Récupération du JWT token pour l utilisateur E2E test...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.access_token) {
        console.log('✅ JWT token obtenu avec succès !');
        console.log('\n📋 Ajoute cette ligne à ton fichier .env.test :');
        console.log(`TEST_JWT=${result.access_token}`);
        console.log('\n📋 Ou ajoute cette ligne à ton fichier .env.local :');
        console.log(`TEST_JWT=${result.access_token}`);
        console.log('\n🎯 Token valide pour 1 heure (3600 secondes)');
      } else {
        console.error('❌ Erreur lors de l authentification :');
        console.error(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur de parsing JSON :', error.message);
      console.error('Response brute :', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur réseau :', error.message);
});

req.write(postData);
req.end();
