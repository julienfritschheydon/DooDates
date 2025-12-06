#!/usr/bin/env node
/**
 * Script wrapper cross-platform pour exécuter Playwright avec un port dynamique
 * Compatible Windows, Linux, macOS
 */

const { execSync } = require('child_process');
const { exec } = require('child_process');

// Obtenir un port libre
function getFreePort() {
  try {
    // Utiliser get-port-cli pour obtenir un port libre
    const port = execSync('npx -y get-port-cli', { encoding: 'utf-8' }).trim();
    return port;
  } catch (error) {
    // Fallback: utiliser un port par défaut
    console.warn('⚠️  Impossible d\'obtenir un port libre, utilisation du port 3000 par défaut');
    return '3000';
  }
}

// Récupérer les arguments passés au script
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node run-playwright-with-port.cjs <playwright-args>');
  process.exit(1);
}

// Obtenir un port libre
const port = getFreePort();

// Définir la variable d'environnement PORT
process.env.PORT = port;

console.log(`🔌 Port utilisé: ${port}`);

// Exécuter playwright avec les arguments passés
const playwrightCommand = `playwright ${args.join(' ')}`;

console.log(`🚀 Exécution: ${playwrightCommand}`);

const child = exec(playwrightCommand, {
  env: { ...process.env, PORT: port },
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('❌ Erreur lors de l\'exécution de Playwright:', error);
  process.exit(1);
});
