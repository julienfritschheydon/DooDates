// Test direct de l'API Resend avec Node.js pur (ES modules)
// Pour isoler le problème du contexte Vite/React

import https from 'https';
import { Buffer } from 'buffer';

// Récupérer la clé API depuis les arguments ou l'environnement
const API_KEY = process.argv[2] || process.env.RESEND_API_KEY;

if (!API_KEY) {
  console.error('❌ Aucune clé API fournie. Usage: node test-resend-direct.js YOUR_API_KEY');
  process.exit(1);
}

console.log('🔑 Clé API:', API_KEY.substring(0, 10) + '...');

const payload = JSON.stringify({
  from: 'onboarding@resend.dev',
  to: ['julien.fritsch@gmail.com'],
  subject: '🧪 Test Direct Node.js - DooDates',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Test Direct API Resend</h2>
      <p>Email envoyé directement via Node.js le ${new Date().toLocaleString('fr-FR')}</p>
      <p><strong>Méthode:</strong> HTTPS direct (pas de SDK)</p>
      <p><strong>Timestamp:</strong> ${Date.now()}</p>
    </div>
  `
});

const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('🌐 Tentative de connexion à api.resend.com...');
console.log('📦 Payload:', JSON.parse(payload));

const req = https.request(options, (res) => {
  console.log('📡 Status Code:', res.statusCode);
  console.log('📡 Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📨 Réponse complète:', data);
    
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
        console.log('✅ ID Email:', response.id);
      } else {
        console.log('❌ ERREUR D\'ENVOI:');
        console.log('❌ Code:', res.statusCode);
        console.log('❌ Message:', response.message || response.error);
      }
    } catch (e) {
      console.log('📄 Réponse brute (non-JSON):', data);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 ERREUR RÉSEAU:', error.message);
  console.error('💥 Code:', error.code);
  console.error('💥 Détails:', error);
});

req.write(payload);
req.end();

console.log('⏳ Envoi en cours...');
