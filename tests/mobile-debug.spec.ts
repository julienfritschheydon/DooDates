import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuration du logger
const logDir = 'logs/mobile-debug';
const logFile = path.join(logDir, `test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Fonction utilitaire pour logger dans la console et dans un fichier
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  // Écrire dans la console
  console.log(logMessage);
  
  // Écrire dans le fichier de log
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

// Configuration du test
test.describe('Débogage Gestes Mobiles', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    // Créer une nouvelle page avec des logs réseau et console
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 }, // Taille mobile (Pixel 5)
      isMobile: true,
      hasTouch: true,
      recordVideo: {
        dir: 'test-results/videos/',
        size: { width: 393, height: 851 }
      }
    });
    
    // Activer les logs réseau
    context.on('request', request => 
      log('NETWORK REQUEST', { url: request.url(), method: request.method() })
    );
    
    context.on('response', response => {
      if (response.status() >= 400) {
        log('NETWORK ERROR', {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    page = await context.newPage();
    
    // Capturer les erreurs de console
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        log(`CONSOLE ${type.toUpperCase()}`, msg.text());
      }
    });
    
    // Capturer les erreurs de page
    page.on('pageerror', error => {
      log('PAGE ERROR', error.message);
    });
    
    // Capturer les requêtes réseau échouées
    page.on('requestfailed', request => {
      log('REQUEST FAILED', {
        url: request.url(),
        failure: request.failure()?.errorText
      });
    });
  });
  
  test.afterAll(async () => {
    await page.close();
    log('Test terminé. Les logs complets sont disponibles ici : ' + path.resolve(logFile));
  });
  
  test('Détection des conflits de gestes tactiles', async () => {
    // Aller à la page de test
    await page.goto('http://localhost:3000');
    
    // Injecter du code pour surveiller les événements tactiles
    await page.addScriptTag({
      content: `
        // Éléments à surveiller
        const elementsToMonitor = ['button', 'a', 'input', 'div[role="button"]', 'div[onClick]'];
        const eventLog = [];
        
        // Fonction pour logger les événements tactiles
        function logTouchEvent(event: TouchEvent & { target: HTMLElement }) {
          const target = event.target as HTMLElement;
          const targetInfo = {
            tag: target.tagName,
            id: target.id || '',
            class: target.className || '',
            type: event.type,
            timestamp: Date.now(),
            position: { 
              x: event.touches && event.touches.length > 0 ? event.touches[0].clientX : 0, 
              y: event.touches && event.touches.length > 0 ? event.touches[0].clientY : 0 
            },
            target: {
              id: target.id,
              tagName: target.tagName,
              className: target.className
            }
          } as const;
          
          eventLog.push(targetInfo);
          console.log('TOUCH_EVENT', targetInfo);
          
          // Empêcher la propagation si nécessaire pour le débogage
          // event.stopPropagation();
          // event.preventDefault();
        }
        
        // Fonction pour détecter les conflits entre événements
        function detectConflicts() {
          // Analyser les 5 derniers événements pour détecter des modèles de conflit
          const recentEvents = eventLog.slice(-5);
          const eventTypes = recentEvents.map(e => e.type);
          
          // Détecter un long-press suivi d'un swipe (conflit potentiel)
          for (let i = 0; i < recentEvents.length - 1; i++) {
            const current = recentEvents[i];
            const next = recentEvents[i + 1];
            
            if (current.type === 'touchstart' && 
                (next.type === 'touchmove' || next.type === 'touchcancel') &&
                (next.timestamp - current.timestamp) > 500) { // >500ms = long press
              
              console.warn('CONFLIT DÉTECTÉ: Long-press suivi de', next.type, {
                duration: next.timestamp - current.timestamp + 'ms',
                start: current.position,
                end: next.position || 'N/A'
              });
              
              // Marquer visuellement l'élément problématique
              const highlight = document.createElement('div');
              highlight.style.position = 'fixed';
              highlight.style.left = '0';
              highlight.style.top = '0';
              highlight.style.width = '100%';
              highlight.style.height = '100%';
              highlight.style.pointerEvents = 'none';
              highlight.style.border = '4px solid red';
              highlight.style.zIndex = '9999';
              document.body.appendChild(highlight);
              
              setTimeout(() => highlight.remove(), 2000);
            }
          }
        }
        
        // Ajouter des écouteurs d'événements tactiles à tous les éléments pertinents
        function addTouchListeners() {
          elementsToMonitor.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
              ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
                element.addEventListener(eventType, logTouchEvent, { passive: true });
              });
            });
          });
          
          // Ajouter un écouteur global pour détecter les conflits
          setInterval(detectConflicts, 100);
        }
        
        // Démarrer la surveillance après le chargement de la page
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', addTouchListeners);
        } else {
          addTouchListeners();
        }
        
        // Exposer les logs pour les tests
        window.getTouchEventLog = () => eventLog;
      `
    });
    
    // Attendre que la page soit interactive
    await page.waitForLoadState('networkidle');
    
    // Prendre une capture d'écran initiale
    await page.screenshot({ path: 'test-results/mobile-debug-initial.png' });
    
    // Attendre un peu pour voir les logs initiaux
    await page.waitForTimeout(1000);
    
    // Exécuter un test de geste long
    log('Début du test de long-press...');
    const button = await page.$('button, [role="button"], .btn');
    
    if (button) {
      const box = await button.boundingBox();
      if (box) {
        // Simuler un long-press (appui maintenu pendant 1,5 seconde)
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        
        // Attendre 1,5 seconde pour simuler un long-press
        await page.waitForTimeout(1500);
        
        // Déplacer légèrement pour simuler un glissement
        await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 20);
        
        // Relâcher
        await page.mouse.up();
        
        log('Test de long-press terminé');
      }
    } else {
      log('Aucun bouton trouvé pour le test de long-press');
    }
    
    // Prendre une capture d'écran finale
    await page.screenshot({ path: 'test-results/mobile-debug-final.png' });
    
    // Récupérer les logs d'événements tactiles
    const touchLogs = await page.evaluate(() => {
      // @ts-ignore - La fonction est définie dans le contexte de la page
      return window.getTouchEventLog ? window.getTouchEventLog() : [];
    });
    
    log('Résumé des événements tactiles capturés :', touchLogs);
    
    // Vérifier que nous avons capturé des événements tactiles
    expect(touchLogs.length).toBeGreaterThan(0);
    
    // Vérifier la présence d'événements de type long-press
    const hasLongPress = touchLogs.some((event: any) => 
      event.type === 'touchmove' && 
      touchLogs.some((e: any) => 
        e.type === 'touchstart' && 
        (event.timestamp - e.timestamp) > 500
      )
    );
    
    log(`Détection de long-press: ${hasLongPress ? 'OUI' : 'NON'}`);
    
    // Vérifier la présence de conflits potentiels
    const potentialConflicts = [];
    for (let i = 0; i < touchLogs.length - 1; i++) {
      const current = touchLogs[i];
      const next = touchLogs[i + 1];
      
      if (current.type === 'touchstart' && 
          (next.type === 'touchmove' || next.type === 'touchcancel') &&
          (next.timestamp - current.timestamp) > 500) {
        potentialConflicts.push({
          duration: next.timestamp - current.timestamp,
          start: current.position,
          end: next.position || 'N/A',
          element: current.target
        });
      }
    }
    
    if (potentialConflicts.length > 0) {
      log('CONFLITS POTENTIELS DÉTECTÉS :', potentialConflicts);
    } else {
      log('Aucun conflit de gestes détecté');
    }
  });
});
