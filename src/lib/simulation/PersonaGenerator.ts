/**
 * PersonaGenerator - Génération de personas pour la simulation
 * 
 * Définit 10 personas représentant différents types de répondants
 * selon le contexte d'usage du questionnaire.
 */

import type { Persona, SimulationContext } from "../../types/simulation";

// ============================================================================
// PERSONAS PRINCIPAUX (5)
// ============================================================================

const PERSONAS_PRINCIPAL: Persona[] = [
  {
    id: "event-organizer",
    name: "Organisateur Événement",
    context: "event",
    traits: {
      responseRate: 0.90,
      attentionSpan: 15,
      detailLevel: "high",
      biasTowardPositive: 0.15,
      skipProbability: 0.05
    }
  },
  {
    id: "casual-participant",
    name: "Participant Casual",
    context: "leisure",
    traits: {
      responseRate: 0.70,
      attentionSpan: 8,
      detailLevel: "low",
      biasTowardPositive: 0.25,
      skipProbability: 0.15
    }
  },
  {
    id: "association-member",
    name: "Membre Association",
    context: "association",
    traits: {
      responseRate: 0.85,
      attentionSpan: 12,
      detailLevel: "medium",
      biasTowardPositive: 0.20,
      skipProbability: 0.08
    }
  },
  {
    id: "engaged-user",
    name: "Utilisateur Engagé",
    context: "feedback",
    traits: {
      responseRate: 0.95,
      attentionSpan: 20,
      detailLevel: "high",
      biasTowardPositive: 0.05,
      skipProbability: 0.03
    }
  },
  {
    id: "research-participant",
    name: "Participant Recherche",
    context: "research",
    traits: {
      responseRate: 0.92,
      attentionSpan: 18,
      detailLevel: "high",
      biasTowardPositive: 0.0,
      skipProbability: 0.04
    }
  }
];

// ============================================================================
// PERSONAS SECONDAIRES (5)
// ============================================================================

const PERSONAS_SECONDARY: Persona[] = [
  {
    id: "student",
    name: "Étudiant",
    context: "leisure",
    traits: {
      responseRate: 0.75,
      attentionSpan: 10,
      detailLevel: "medium",
      biasTowardPositive: 0.20,
      skipProbability: 0.12
    }
  },
  {
    id: "skeptical",
    name: "Sceptique",
    context: "feedback",
    traits: {
      responseRate: 0.80,
      attentionSpan: 12,
      detailLevel: "medium",
      biasTowardPositive: -0.15, // Biais négatif
      skipProbability: 0.10
    }
  },
  {
    id: "rushed",
    name: "Pressé",
    context: "event",
    traits: {
      responseRate: 0.65,
      attentionSpan: 6,
      detailLevel: "low",
      biasTowardPositive: 0.10,
      skipProbability: 0.20
    }
  },
  {
    id: "senior",
    name: "Senior",
    context: "association",
    traits: {
      responseRate: 0.88,
      attentionSpan: 14,
      detailLevel: "high",
      biasTowardPositive: 0.25,
      skipProbability: 0.06
    }
  },
  {
    id: "international",
    name: "International",
    context: "research",
    traits: {
      responseRate: 0.82,
      attentionSpan: 11,
      detailLevel: "medium",
      biasTowardPositive: 0.10,
      skipProbability: 0.09
    }
  }
];

// ============================================================================
// TOUS LES PERSONAS
// ============================================================================

/**
 * Liste complète des 10 personas
 */
export const ALL_PERSONAS: Persona[] = [
  ...PERSONAS_PRINCIPAL,
  ...PERSONAS_SECONDARY
];

// ============================================================================
// SÉLECTION PAR CONTEXTE
// ============================================================================

/**
 * Mapping contexte → personas recommandés
 */
const PERSONAS_BY_CONTEXT: Record<SimulationContext, string[]> = {
  event: [
    "event-organizer",
    "casual-participant",
    "rushed",
    "senior"
  ],
  feedback: [
    "engaged-user",
    "casual-participant",
    "skeptical",
    "association-member"
  ],
  leisure: [
    "casual-participant",
    "student",
    "rushed",
    "event-organizer"
  ],
  association: [
    "association-member",
    "senior",
    "engaged-user",
    "event-organizer"
  ],
  research: [
    "research-participant",
    "international",
    "engaged-user",
    "student"
  ]
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère un persona par son ID
 */
export function getPersonaById(id: string): Persona | undefined {
  return ALL_PERSONAS.find(p => p.id === id);
}

/**
 * Récupère tous les personas d'un contexte
 */
export function getPersonasByContext(context: SimulationContext): Persona[] {
  const personaIds = PERSONAS_BY_CONTEXT[context] || [];
  return personaIds
    .map(id => getPersonaById(id))
    .filter((p): p is Persona => p !== undefined);
}

/**
 * Sélectionne un persona aléatoire pour un contexte
 */
export function selectRandomPersona(context: SimulationContext): Persona {
  const personas = getPersonasByContext(context);
  
  if (personas.length === 0) {
    // Fallback sur casual-participant si aucun persona trouvé
    return getPersonaById("casual-participant")!;
  }
  
  const randomIndex = Math.floor(Math.random() * personas.length);
  return personas[randomIndex];
}

/**
 * Sélectionne N personas aléatoires pour un contexte
 * avec distribution équilibrée
 */
export function selectPersonas(
  context: SimulationContext,
  count: number
): Persona[] {
  const availablePersonas = getPersonasByContext(context);
  
  if (availablePersonas.length === 0) {
    // Fallback
    return Array(count).fill(getPersonaById("casual-participant")!);
  }
  
  const selected: Persona[] = [];
  
  // Distribution équilibrée : on cycle à travers les personas disponibles
  for (let i = 0; i < count; i++) {
    const index = i % availablePersonas.length;
    selected.push(availablePersonas[index]);
  }
  
  // Mélanger pour éviter un pattern prévisible
  return shuffleArray(selected);
}

/**
 * Mélange un tableau (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Statistiques sur les personas
 */
export function getPersonaStats() {
  return {
    total: ALL_PERSONAS.length,
    principal: PERSONAS_PRINCIPAL.length,
    secondary: PERSONAS_SECONDARY.length,
    byContext: Object.entries(PERSONAS_BY_CONTEXT).map(([context, ids]) => ({
      context,
      count: ids.length,
      personas: ids
    })),
    avgResponseRate: 
      ALL_PERSONAS.reduce((sum, p) => sum + p.traits.responseRate, 0) / ALL_PERSONAS.length,
    avgAttentionSpan:
      ALL_PERSONAS.reduce((sum, p) => sum + p.traits.attentionSpan, 0) / ALL_PERSONAS.length
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  PERSONAS_PRINCIPAL,
  PERSONAS_SECONDARY
};
