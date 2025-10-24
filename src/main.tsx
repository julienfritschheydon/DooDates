import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./pwa-styles.css";
import { logger } from "@/lib/logger";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);

// Fonction pour forcer le plein écran sur Android
function forceFullscreenOnAndroid() {
  // Détecter si on est en mode PWA standalone
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isStandalone && isAndroid) {
    // Masquer la barre d'adresse Android
    window.scrollTo(0, 1);

    // Forcer le plein écran si disponible
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        logger.debug("Fullscreen non supporté sur ce navigateur", "general");
      });
    }

    // Masquer la barre de statut Android
    if ("screen" in window && "orientation" in window.screen) {
      try {
        (window.screen.orientation as any).lock("portrait-primary");
      } catch (e) {
        logger.debug("Orientation lock non supporté", "general");
      }
    }
  }
}

// Enregistrement du Service Worker PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info("Service Worker enregistré avec succès", "general", {
          scope: registration.scope,
        });

        // Forcer le plein écran après enregistrement SW
        setTimeout(forceFullscreenOnAndroid, 1000);
      })
      .catch((error) => {
        logger.warn("Échec enregistrement Service Worker", "general", error);
      });
  });
}

// Forcer le plein écran au chargement
window.addEventListener("DOMContentLoaded", forceFullscreenOnAndroid);

// Forcer le plein écran quand l'app devient visible
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    setTimeout(forceFullscreenOnAndroid, 500);
  }
});
