import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './pwa-styles.css'

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Fonction pour forcer le plein écran sur Android
function forceFullscreenOnAndroid() {
  // Détecter si on est en mode PWA standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (isStandalone && isAndroid) {
    // Masquer la barre d'adresse Android
    window.scrollTo(0, 1);
    
    // Forcer le plein écran si disponible
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        console.log('DooDates PWA: Fullscreen non supporté sur ce navigateur');
      });
    }
    
    // Masquer la barre de statut Android
    if ('screen' in window && 'orientation' in window.screen) {
      try {
        (window.screen.orientation as any).lock('portrait-primary');
      } catch (e) {
        console.log('DooDates PWA: Orientation lock non supporté');
      }
    }
  }
}

// Enregistrement du Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('DooDates PWA: Service Worker enregistré avec succès', registration.scope);
        
        // Forcer le plein écran après enregistrement SW
        setTimeout(forceFullscreenOnAndroid, 1000);
      })
      .catch((error) => {
        console.log('DooDates PWA: Échec enregistrement Service Worker', error);
      });
  });
}

// Forcer le plein écran au chargement
window.addEventListener('DOMContentLoaded', forceFullscreenOnAndroid);

// Forcer le plein écran quand l'app devient visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(forceFullscreenOnAndroid, 500);
  }
});
