/**
 * Quotas centralisés DooDates
 *
 * ⚠️ SOURCE DE VÉRITÉ UNIQUE - Ne pas dupliquer ces valeurs ailleurs
 *
 * Système de quotas freemium :
 * - Anonyme : 20 crédits (généreux pour phase beta)
 * - Authentifié : Quotas élevés pour encourager l'adoption
 *
 * Note : Les quotas anonymes sont à 20 pour tous les environnements (dev/E2E/prod)
 * afin d'éviter les bugs de détection et faciliter les tests.
 *
 * Voici pourquoi maintenir des compteurs séparés dans notre système de quotas reste pertinent :

Pourquoi maintenir des compteurs séparés dans notre système de quotas reste pertinent :

1. Équilibre produit & segmentation utilisateur

Invités vs authentifiés : les quotas distincts matérialisent la montée en valeur lorsque l’on crée un compte (ex. 20 crédits invités, 50 authentifiés). Sans séparation, l’on perdrait ce levier de conversion et la visibilité sur la valeur offerte à chaque segment.
Interfaces IA vs actions manuelles : pouvoir compter séparément les conversations IA, les exports ou les requêtes d’analytics permet d’ajuster finement l’expérience (prioriser un budget IA par rapport aux exports, détecter une consommation déséquilibrée, etc.).

2. Monitoring, alertes et pilotage précis
Détection anomalies : un pic soudain sur un compteur donné (ex. conversations IA) déclenche une alerte ciblée, évitant de saturer toute la plateforme.
Rapports & dashboards : suivre le détail par type d’action facilite les post-mortems, la priorisation ou la communication (ex. “les exports explosent, renforçons le cache PDF”).
Planification capacité : chaque compteur isole une charge serveur spécifique (Supabase, Gemini, stockage), ce qui aide à anticiper l’infrastructure nécessaire.

3. Modèle économique & évolutivité
Monétisation graduée : proposer des packs “Analytics IA illimités” versus “Exports IA illimités” devient trivial quand les compteurs sont distincts.
A/B testing tarifaire : on peut tester des quotas différents sans impacter les autres métriques.
Évolutions futures : ajouter un nouveau type de compteur (ex. “Actions collaboratives”) ne casse pas les métriques historiques.

4. UX & transparence
Feedback utilisateur clair : un tableau de bord qui montre “Messages IA restants” et “Exports restants” évite la confusion. Un compteur unique donnerait l’impression aléatoire que les crédits fondent.
Guidage contextuel : si seul le compteur “Analytics” est plein, on peut suggérer de passer à la formule supérieure ciblée plutôt que d’alerter sur un quota global.

5. Sécurité & prévention abus
Rate limiting ciblé : si un bot abuse des requêtes IA, on bloque ce compteur sans priver l’utilisateur de gérer ses sondages ou ses exports.
Application des SLA : certains flux peuvent exiger une disponibilité plus stricte (ex. analytics) ; les compteurs séparés rendent cette surveillance possible.
Risques si on fusionne tout en un quota unique

 * Dernière mise à jour : 10 Nov 2025
 */

// ============================================================================
// QUOTAS CONVERSATIONS
// ============================================================================

/**
 * Nombre maximum de conversations IA
 *
 * Une conversation = une session de création de sondage avec l'IA
 * Les modifications d'un sondage existant ne comptent pas comme nouvelle conversation
 */
export const CONVERSATION_QUOTAS = {
  /** Utilisateurs anonymes : 20 pour dev/E2E/prod (simplifié pour éviter bugs) */
  ANONYMOUS: 20,

  /** Utilisateurs authentifiés : 1000 conversations */
  AUTHENTICATED: 1000,
} as const;

// ============================================================================
// QUOTAS MESSAGES IA
// ============================================================================

/**
 * Nombre maximum de messages IA par conversation
 *
 * Limite anti-spam pour éviter les conversations infinies
 * Réduit pour compenser l'usage facilité par reconnaissance vocale
 */
export const AI_MESSAGE_QUOTAS = {
  /** Utilisateurs anonymes : 20 pour dev/E2E/prod (simplifié pour éviter bugs) */
  ANONYMOUS: 20,

  /** Utilisateurs authentifiés : 100 messages par mois */
  AUTHENTICATED: 100,
} as const;

// ============================================================================
// QUOTAS POLLS
// ============================================================================

/**
 * Nombre maximum de sondages créés par conversation
 *
 * Empêche la création excessive de sondages dans une même conversation
 */
export const POLL_CREATION_QUOTAS = {
  /** Utilisateurs anonymes : 20 pour dev/E2E/prod (simplifié pour éviter bugs) */
  ANONYMOUS: 20,

  /** Utilisateurs authentifiés : 5 polls par conversation */
  AUTHENTICATED: 5,
} as const;

/**
 * Limites par type de poll (date, form, quizz, availability)
 * 
 * ⚠️ VALEURS TEMPORAIRES - Les valeurs exactes seront définies dans le planning de décembre
 */
export const POLL_TYPE_QUOTAS = {
  ANONYMOUS: {
    DATE_POLLS: 5,
    FORM_POLLS: 5,
    QUIZZ: 5,
    AVAILABILITY_POLLS: 5,
  },
  AUTHENTICATED: {
    DATE_POLLS: 50, // Valeur temporaire
    FORM_POLLS: 50, // Valeur temporaire
    QUIZZ: 50, // Valeur temporaire
    AVAILABILITY_POLLS: 50, // Valeur temporaire
  },
} as const;

// ============================================================================
// QUOTAS ANALYTICS IA
// ============================================================================

/**
 * Nombre maximum de requêtes analytics conversationnels par jour
 *
 * Les insights automatiques ne comptent pas (1 seul appel par poll, mis en cache)
 */
export const ANALYTICS_QUOTAS = {
  /** Utilisateurs anonymes : 20 pour dev/E2E/prod (simplifié pour éviter bugs) */
  ANONYMOUS: 20,

  /** Utilisateurs authentifiés : 50 queries par jour */
  AUTHENTICATED: 50,
} as const;

// ============================================================================
// QUOTAS STOCKAGE
// ============================================================================

/**
 * Limites de stockage localStorage (approximatif)
 */
export const STORAGE_QUOTAS = {
  /** Utilisateurs anonymes : 50 MB */
  ANONYMOUS: 50,

  /** Utilisateurs authentifiés : 1000 MB (1 GB) */
  AUTHENTICATED: 1000,
} as const;

// ============================================================================
// RÉTENTION DES DONNÉES
// ============================================================================

/**
 * Durée de conservation des données avant auto-suppression
 */
export const RETENTION_DAYS = {
  /** Utilisateurs anonymes : 30 jours */
  ANONYMOUS: 30,

  /** Utilisateurs authentifiés : 365 jours (1 an) */
  AUTHENTICATED: 365,
} as const;

// ============================================================================
// COOLDOWNS ANTI-SPAM
// ============================================================================

/**
 * Délais minimum entre actions pour éviter le spam
 */
export const COOLDOWNS = {
  /** Délai minimum entre messages IA : 3 secondes */
  AI_MESSAGE: 3000,

  /** Délai minimum entre créations de poll : 5 secondes */
  POLL_CREATION: 5000,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Récupère les limites de conversations selon le type d'utilisateur
 */
export function getConversationLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? CONVERSATION_QUOTAS.AUTHENTICATED : CONVERSATION_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites de messages IA selon le type d'utilisateur
 */
export function getAiMessageLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? AI_MESSAGE_QUOTAS.AUTHENTICATED : AI_MESSAGE_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites de création de polls selon le type d'utilisateur
 */
export function getPollCreationLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? POLL_CREATION_QUOTAS.AUTHENTICATED : POLL_CREATION_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites d'analytics selon le type d'utilisateur
 */
export function getAnalyticsLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? ANALYTICS_QUOTAS.AUTHENTICATED : ANALYTICS_QUOTAS.ANONYMOUS;
}

/**
 * Récupère toutes les limites pour un type d'utilisateur
 */
export function getAllQuotas(isAuthenticated: boolean) {
  return {
    conversations: getConversationLimit(isAuthenticated),
    aiMessages: getAiMessageLimit(isAuthenticated),
    pollCreation: getPollCreationLimit(isAuthenticated),
    analytics: getAnalyticsLimit(isAuthenticated),
    storage: isAuthenticated ? STORAGE_QUOTAS.AUTHENTICATED : STORAGE_QUOTAS.ANONYMOUS,
    retentionDays: isAuthenticated ? RETENTION_DAYS.AUTHENTICATED : RETENTION_DAYS.ANONYMOUS,
  };
}
