/**
 * 🛡️ BASE URL UTILITIES - GitHub Pages Protection
 * 
 * Utilisez cette fonction pour toutes les URLs dynamiques
 * Évite les doubles préfixes /DooDates/DooDates/
 */

export function getBaseUrl(): string {
  return import.meta.env.BASE_URL || "/";
}

export function buildUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // S'assurer que le path ne commence pas par /
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${baseUrl}${cleanPath}`;
}

export function buildAbsoluteUrl(path: string): string {
  const origin = typeof window !== "undefined" && window.location?.origin 
    ? window.location.origin 
    : "http://localhost:8080";
  return `${origin}${buildUrl(path)}`;
}

export function buildPollUrl(pollId: string): string {
  return buildUrl(`poll/${pollId}`);
}

export function buildQuizzUrl(slug: string, action: "vote" | "results" = "vote"): string {
  return buildUrl(`quizz/${slug}/${action}`);
}

export function buildAuthUrl(path: string): string {
  return buildUrl(`auth/${path}`);
}

export function buildDocsUrl(path: string): string {
  return buildUrl(`docs/${path}`);
}

export function buildApiUrl(path: string): string {
  return buildUrl(`api/${path}`);
}

export function navigateToUrl(path: string) {
  window.location.href = buildUrl(path);
}

export function navigateToAbsoluteUrl(path: string) {
  window.location.href = buildAbsoluteUrl(path);
}
