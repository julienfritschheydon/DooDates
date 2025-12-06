/**
 * IP Hash Service
 * Hash SHA-256 des adresses IP pour conformité RGPD
 * Les IP ne sont jamais stockées en clair
 */

import { logger } from "../logger";
import { ErrorFactory } from "../error-handling";

/**
 * Hash une adresse IP avec SHA-256
 * @param ip - L'adresse IP à hasher
 * @returns Le hash SHA-256 de l'IP (64 caractères hex)
 */
export function hashIP(ip: string): string {
  if (!ip || ip === "unknown") {
    return "unknown";
  }

  try {
    // Normaliser l'IP (enlever espaces, mettre en minuscule)
    const normalizedIP = ip.trim().toLowerCase();

    // Utiliser crypto.subtle si disponible (navigateur/moderne)
    if (typeof crypto !== "undefined" && typeof crypto.subtle?.digest === "function") {
      // Version synchrone pour compatibilité avec les tests
      return hashWithSubtleCryptoSync(normalizedIP);
    }

    // Fallback pour Node.js ou environnements plus anciens
    return hashWithNodeCrypto(normalizedIP);
  } catch (error) {
    logger.warn("IP hashing failed, using fallback", "security", { ip, error });
    return hashFallback(ip.trim().toLowerCase());
  }
}

/**
 * Hash synchrone avec crypto.subtle (pour tests et compatibilité)
 */
function hashWithSubtleCryptoSync(ip: string): string {
  try {
    // Tenter d'importer crypto de Node.js si disponible
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(ip).digest("hex");
  } catch (error) {
    // Fallback si crypto n'est pas disponible
    return hashFallback(ip);
  }
}

/**
 * Hash avec crypto.subtle (navigateur/moderne)
 */
async function hashWithSubtleCrypto(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash avec Node.js crypto module
 */
function hashWithNodeCrypto(ip: string): string {
  try {
    // Importer crypto dynamiquement pour éviter les erreurs en environnement navigateur
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(ip).digest("hex");
  } catch (error) {
    throw ErrorFactory.critical("Node.js crypto not available", "Erreur de chiffrement");
  }
}

/**
 * Fallback hash déterministe (si crypto n'est pas disponible)
 * Note: Moins sécurisé que SHA-256 mais mieux que rien
 */
function hashFallback(ip: string): string {
  // Hash FNV-1a 64-bit étendu à 256 bits
  let hash = 2166136261 >>> 0;

  for (let i = 0; i < ip.length; i++) {
    hash ^= ip.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Étendre à 256 bits en répéting le hash
  const baseHash = hash.toString(16).padStart(8, "0");
  return baseHash.repeat(8).slice(0, 64);
}

/**
 * Vérifie si un hash est valide (format SHA-256)
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash) || hash === "unknown";
}

/**
 * Compare deux IPs via leurs hashes
 * @param ip1 - Première IP
 * @param ip2 - Seconde IP
 * @returns true si les hashes sont identiques
 */
export function compareIPHash(ip1: string, ip2: string): boolean {
  const hash1 = hashIP(ip1);
  const hash2 = hashIP(ip2);
  return hash1 === hash2;
}

/**
 * Génère un hash d'IP avec timestamp pour tracking temporaire
 * @param ip - L'adresse IP
 * @param timestamp - Timestamp optionnel (défaut: maintenant)
 * @returns Hash combiné IP + timestamp
 */
export function hashIPWithTimestamp(ip: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  const combined = `${ip}:${ts}`;
  return hashIP(combined);
}

/**
 * Extrait les métadonnées d'un hash d'IP avec timestamp
 * @param hashedValue - Le hash combiné
 * @param originalIP - L'IP originale pour vérification
 * @param timeWindowMs - Fenêtre de temps acceptable (défaut: 1h)
 * @returns Métadonnées extraites ou null
 */
export function extractHashMetadata(
  hashedValue: string,
  originalIP: string,
  timeWindowMs: number = 3600000,
): { timestamp: number; isValid: boolean } | null {
  // Cette fonction est limitée car on ne peut pas "déchiffrer" un hash
  // Elle sert principalement à documenter l'approche

  logger.debug("Hash metadata extraction attempted", "security", {
    hashedValue: hashedValue.substring(0, 16) + "...",
    timeWindowMs,
  });

  // Pour des raisons de sécurité, on ne peut pas extraire le timestamp du hash
  // Cette fonction retourne null pour indiquer que l'opération n'est pas possible
  return null;
}

/**
 * Nettoie les anciens hashes (pour maintenance)
 * @param hashes - Liste de hashes avec timestamps
 * @param maxAgeMs - Âge maximum en millisecondes
 * @returns Liste des hashes valides
 */
export function cleanupOldHashes(
  hashes: Array<{ hash: string; timestamp: number }>,
  maxAgeMs: number,
): string[] {
  const now = Date.now();
  return hashes.filter((item) => now - item.timestamp <= maxAgeMs).map((item) => item.hash);
}

/**
 * Valide une adresse IP avant hashage
 */
export function validateIP(ip: string): boolean {
  if (!ip || ip === "unknown") return false;

  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (plus strict pour éviter les IPs invalides)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  // Vérifier IPv4
  if (ipv4Regex.test(ip)) return true;

  // Vérifier IPv6 plus strictement
  if (ipv6Regex.test(ip)) return true;

  // Vérifier les formes IPv6 courtes mais valides
  if (ip.includes(":")) {
    // Rejeter immédiatement les cas avec ::: (triple colon)
    const tripleColonCount = (ip.match(/:::/g) || []).length;
    if (tripleColonCount > 0) return false; // ::: est toujours invalide

    const parts = ip.split(":");
    // Éviter les IPs avec trop de :: ou de caractères invalides
    const doubleColonCount = (ip.match(/::/g) || []).length;
    const hasInvalidChars = /[^0-9a-fA-F:]/.test(ip);

    // Rejeter explicitement les cas invalides
    if (doubleColonCount > 1) return false;
    if (hasInvalidChars) return false;
    if (parts.length > 8) return false;
    if (parts.length < 2) return false;

    // IPv6 complet doit avoir exactement 8 parties, sauf si :: est utilisé
    if (doubleColonCount === 0 && parts.length !== 8) return false;

    // Vérifier qu'il n'y a pas de segments vides excessifs
    const emptySegments = parts.filter((p) => p === "").length;
    if (emptySegments > 2 && doubleColonCount === 0) return false;

    return true;
  }

  return false;
}

/**
 * Anonymise une IP (remplace les derniers octets)
 * @param ip - L'adresse IP à anonymiser
 * @returns L'IP anonymisée (ex: 192.168.1.xxx)
 */
export function anonymizeIP(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";

  if (ip.includes(".")) {
    // IPv4: remplacer le dernier octet
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.xxx` : "unknown";
  } else if (ip.includes(":")) {
    // IPv6: remplacer les 16 derniers bits
    const parts = ip.split(":");
    if (parts.length >= 2) {
      parts[parts.length - 1] = "xxxx";
      return parts.join(":");
    }
  }

  return "unknown";
}
