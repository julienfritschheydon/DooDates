/**
 * Browser Fingerprinting Service
 * Génère une empreinte unique du navigateur pour tracking des quotas guests
 *
 * Techniques utilisées:
 * - Canvas fingerprinting (rendu graphique unique)
 * - WebGL fingerprinting (GPU/driver)
 * - Fonts disponibles
 * - Timezone et langue
 * - Screen resolution et color depth
 * - Hardware concurrency (nombre de CPU cores)
 * - Platform et user agent
 */

import { logger } from "./logger";

export interface BrowserFingerprint {
  fingerprint: string; // Hash SHA-256 de toutes les données
  components: {
    canvas?: string;
    webgl?: string;
    fonts?: string;
    timezone: string;
    language: string;
    screen: string;
    hardware: string;
    platform: string;
    userAgent: string;
  };
  metadata: {
    timestamp: string;
    confidence: number; // 0-100 (qualité du fingerprint)
  };
}

/**
 * Génère un fingerprint canvas (rendu graphique unique par navigateur/GPU)
 */
function getCanvasFingerprint(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    // Dessiner du texte avec différentes polices et styles
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("DooDates 🗓️", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("DooDates 🗓️", 4, 17);

    return canvas.toDataURL();
  } catch (error) {
    logger.debug("Canvas fingerprint failed", "security", { error });
    return undefined;
  }
}

/**
 * Génère un fingerprint WebGL (GPU et driver)
 */
function getWebGLFingerprint(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return undefined;

    const webglContext = gl as WebGLRenderingContext;
    const debugInfo = webglContext.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return undefined;

    const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  } catch (error) {
    logger.debug("WebGL fingerprint failed", "security", { error });
    return undefined;
  }
}

/**
 * Détecte les fonts disponibles (technique de mesure de largeur)
 */
function getFontsFingerprint(): string | undefined {
  try {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testFonts = [
      "Arial",
      "Verdana",
      "Times New Roman",
      "Courier New",
      "Georgia",
      "Palatino",
      "Garamond",
      "Comic Sans MS",
      "Trebuchet MS",
      "Impact",
    ];

    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    // Mesurer largeur avec fonts de base
    const baseFontWidths: Record<string, number> = {};
    baseFonts.forEach((font) => {
      ctx.font = `${testSize} ${font}`;
      baseFontWidths[font] = ctx.measureText(testString).width;
    });

    // Détecter quelles fonts sont disponibles
    const availableFonts: string[] = [];
    testFonts.forEach((font) => {
      let detected = false;
      baseFonts.forEach((baseFont) => {
        ctx.font = `${testSize} '${font}', ${baseFont}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseFontWidths[baseFont]) {
          detected = true;
        }
      });
      if (detected) {
        availableFonts.push(font);
      }
    });

    return availableFonts.sort().join(",");
  } catch (error) {
    logger.debug("Fonts fingerprint failed", "security", { error });
    return undefined;
  }
}

/**
 * Hash une chaîne avec SHA-256
 */
async function hashString(str: string): Promise<string> {
  try {
    const hasSubtle = typeof crypto !== "undefined" && typeof crypto.subtle?.digest === "function";
    if (hasSubtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (error) {
    logger.warn("Native SHA-256 digest failed", "security", { error });
  }

  // Fallback FNV-1a inspired hash (deterministic, 64 hex chars)
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const result = hash.toString(16).padStart(8, "0");
  return result.repeat(8).slice(0, 64);
}

/**
 * Génère un fingerprint complet du navigateur
 */
export async function generateBrowserFingerprint(): Promise<BrowserFingerprint> {
  logger.debug("Generating browser fingerprint", "security");

  // Collecter tous les composants
  const canvas = getCanvasFingerprint();
  const webgl = getWebGLFingerprint();
  const fonts = getFontsFingerprint();

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const hardware = `${navigator.hardwareConcurrency || "unknown"}`;
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;

  // Calculer score de confiance (0-100)
  let confidence = 0;
  if (canvas) confidence += 40; // Canvas = le plus important
  if (webgl) confidence += 30; // WebGL = très discriminant
  if (fonts) confidence += 20; // Fonts = bon indicateur
  confidence += 10; // Timezone/screen/etc = baseline

  // Créer la chaîne à hasher
  const components = {
    canvas,
    webgl,
    fonts,
    timezone,
    language,
    screen,
    hardware,
    platform,
    userAgent,
  };

  const fingerprintString = Object.entries(components)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  // Générer le hash SHA-256
  const fingerprint = await hashString(fingerprintString);

  logger.info("Browser fingerprint generated", "security", {
    fingerprint: fingerprint.substring(0, 16) + "...",
    confidence,
    componentsCount: Object.values(components).filter((v) => v !== undefined).length,
  });

  return {
    fingerprint,
    components,
    metadata: {
      timestamp: new Date().toISOString(),
      confidence,
    },
  };
}

/**
 * Récupère le fingerprint depuis le cache localStorage ou le génère
 */
export async function getCachedFingerprint(): Promise<string> {
  const CACHE_KEY = "__dd_fingerprint";
  const LEGACY_CACHE_KEYS = ["doodates_browser_fingerprint"];
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

  try {
    const readCache = (): { fingerprint: string; timestamp: string; confidence?: number } | null => {
      const keys = [CACHE_KEY, ...LEGACY_CACHE_KEYS];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.fingerprint === "string" && typeof parsed?.timestamp === "string") {
            return parsed;
          }
        } catch (error) {
          logger.warn("Invalid fingerprint cache", "security", { key, error });
        }
      }
      return null;
    };

    const cached = readCache();
    if (cached) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      if (Number.isFinite(age) && age >= 0 && age < CACHE_DURATION) {
        logger.debug("Using cached fingerprint", "security", {
          ageHours: Math.round(age / 1000 / 60 / 60),
          confidence: cached.confidence,
        });
        if (!localStorage.getItem(CACHE_KEY)) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        }
        return cached.fingerprint;
      }
    }

    const result = await generateBrowserFingerprint();
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        fingerprint: result.fingerprint,
        timestamp: result.metadata.timestamp,
        confidence: result.metadata.confidence,
      }),
    );

    return result.fingerprint;
  } catch (error) {
    logger.error("Failed to get fingerprint", "security", { error });
    const fallback = `fallback_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    return hashString(fallback);
  }
}

/**
 * Récupère les métadonnées du navigateur pour stockage
 */
export function getBrowserMetadata() {
  return {
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
  };
}
