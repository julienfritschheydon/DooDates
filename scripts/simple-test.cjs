#!/usr/bin/env node

/**
 * Test simple - Juste vérifier que NODE_ENV=development fonctionne
 */

const { spawn } = require('child_process');

console.log('🚀 Test simple - NODE_ENV=development');

const envVars = {
  ...process.env,
  CI: 'true',
  NODE_ENV: 'development',
  BASE_URL: 'http://localhost:8080/DooDates',
  VITE_GEMINI_API_KEY: 'TEST_MODE'
};

const child = spawn('npx', [
  'playwright', 'test', 
  'tests/e2e/ci-debug-chat-input.spec.ts', 
  '--project=chromium', 
  '--reporter=list'
], {
  env: envVars,
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ SUCCÈS ! NODE_ENV=development fonctionne');
  } else {
    console.log('❌ ÉCHEC - NODE_ENV=development ne suffit pas');
  }
  process.exit(code);
});
