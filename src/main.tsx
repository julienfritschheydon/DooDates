import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import "@/lib/zodConfig";
import App from "./App";
import "./index.css";
import "./pwa-styles.css";
import "./styles/docs.css";
import { logger } from "@/lib/logger";
import { generateBrowserFingerprint, getCachedFingerprint } from "@/lib/browserFingerprint";
import { isE2ETestingEnvironment } from "@/lib/e2e-detection";
import { logError } from "@/lib/error-handling";

// DEBUG: Exposer la fonction de fingerprinting sur window pour tests console
declare global {
  interface Window {
    testFingerprint?: () => Promise<Awaited<ReturnType<typeof generateBrowserFingerprint>>>;
    getCachedFingerprint?: () => Promise<string>;
  }
}
// Exposer getCachedFingerprint pour les tests E2E (DEV ou E2E)
// eslint-disable-next-line no-constant-condition
if (import.meta.env.DEV || isE2ETestingEnvironment() || true) {
  // Force enable for production debugging
  if (import.meta.env.DEV) {
    window.testFingerprint = async () => {
      const fp = await generateBrowserFingerprint();
      console.log("Fingerprint:", fp.fingerprint);
      console.log("Confidence:", fp.metadata.confidence);
      console.log("Components:", fp.components);
      return fp;
    };
  }
  // Exposer getCachedFingerprint pour les tests E2E
  window.getCachedFingerprint = async () => {
    return await getCachedFingerprint();
  };
}

console.log("[MAIN-DEBUG] Mounting React application...");

try {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>,
  );
  console.log("[MAIN-DEBUG] React mount called successfully.");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logError(error instanceof Error ? error : new Error(errorMessage), {
    component: "main",
    operation: "mount",
  });
}

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
    if (
      "screen" in window &&
      "orientation" in window.screen &&
      "lock" in window.screen.orientation &&
      typeof window.screen.orientation.lock === "function"
    ) {
      try {
        window.screen.orientation.lock("portrait-primary");
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
      .register(`${import.meta.env.BASE_URL}sw.js`)
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
