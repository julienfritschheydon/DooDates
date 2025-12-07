const { exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Utiliser le même port que Playwright (via process.env.PORT), avec 8080 en fallback local
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const TIMEOUT = process.env.CI ? 180000 : 120000; // 3 min en CI, 2 min en local

// Vérifier si le serveur est déjà en cours d'exécution
function isServerRunning(port, callback) {
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/DooDates/',
    method: 'HEAD',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    callback(res.statusCode === 200 || res.statusCode === 304);
  });

  req.on('error', () => {
    callback(false);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });

  req.end();
}

// Vérifier si le serveur répond
function waitForServer(url, maxAttempts = 30, interval = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkServer = () => {
      attempts++;

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log('Server is ready!');
          resolve(true);
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server returned status code ${res.statusCode}`));
          } else {
            setTimeout(checkServer, interval);
          }
        }
      }).on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Failed to connect to server: ${err.message}`));
        } else {
          setTimeout(checkServer, interval);
        }
      });
    };

    checkServer();
  });
}

// Démarrer le serveur Vite
function startVite() {
  console.log('Starting Vite dev server...');

  const viteProcess = exec('npx vite --mode test', {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      VITE_HMR: 'false',
      VITE_DEV_SERVER_OPTIMIZE_DEPS: 'false',
      FORCE_COLOR: '1',
    },
  });

  viteProcess.stdout.pipe(process.stdout);
  viteProcess.stderr.pipe(process.stderr);

  return new Promise((resolve, reject) => {
    // Vérifier si le serveur démarre correctement
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start within ${TIMEOUT / 1000} seconds`));
    }, TIMEOUT);

    // Attendre que le serveur soit prêt
    waitForServer(`http://localhost:${PORT}/DooDates/`)
      .then(() => {
        clearTimeout(timeout);
        resolve(viteProcess);
      })
      .catch(reject);
  });
}

// Point d'entrée
async function main() {
  try {
    // Vérifier si le serveur est déjà en cours d'exécution
    isServerRunning(PORT, (isRunning) => {
      if (isRunning) {
        console.log(`Server is already running on port ${PORT}`);
        // Garder le processus en vie
        setInterval(() => { }, 1000);
      } else {
        // Démarrer un nouveau serveur
        startVite().catch(error => {
          console.error('Failed to start Vite server:', error);
          process.exit(1);
        });
      }
    });

    // Gérer la sortie proprement
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
