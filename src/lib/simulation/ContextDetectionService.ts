/**
 * ContextDetectionService - Détection automatique du contexte du questionnaire
 */

import type { SimulationContext } from "../../types/simulation";

/**
 * Mots-clés par contexte
 */
const CONTEXT_KEYWORDS: Record<SimulationContext, string[]> = {
  event: [
    "événement", "soirée", "fête", "mariage", "anniversaire", "célébration",
    "réception", "gala", "concert", "spectacle", "festival", "conférence",
    "séminaire", "atelier", "workshop", "rencontre", "réunion"
  ],
  feedback: [
    "satisfaction", "avis", "opinion", "retour", "feedback", "évaluation",
    "note", "appréciation", "expérience", "service", "qualité", "amélioration",
    "recommandation", "produit", "prestation", "performance"
  ],
  leisure: [
    "loisir", "activité", "sortie", "vacances", "weekend", "détente",
    "divertissement", "hobby", "passion", "sport", "jeu", "voyage",
    "restaurant", "cinéma", "théâtre", "musée", "parc"
  ],
  association: [
    "association", "club", "groupe", "communauté", "membre", "adhérent",
    "bénévole", "projet", "action", "initiative", "réunion", "assemblée",
    "comité", "bureau", "équipe", "collectif"
  ],
  research: [
    "étude", "recherche", "enquête", "sondage", "analyse", "données",
    "statistique", "questionnaire", "participant", "échantillon", "résultat",
    "scientifique", "académique", "universitaire", "thèse", "mémoire"
  ]
};

/**
 * Détecte le contexte d'un questionnaire
 */
export function detectContext(
  title: string,
  questions: Array<{ title: string; type: string }>
): SimulationContext {
  const text = [
    title,
    ...questions.map(q => q.title)
  ].join(" ").toLowerCase();

  // Compter les occurrences de mots-clés par contexte
  const scores: Record<SimulationContext, number> = {
    event: 0,
    feedback: 0,
    leisure: 0,
    association: 0,
    research: 0
  };

  Object.entries(CONTEXT_KEYWORDS).forEach(([context, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[context as SimulationContext]++;
      }
    });
  });

  // Trouver le contexte avec le score le plus élevé
  let maxScore = 0;
  let detectedContext: SimulationContext = "feedback"; // Par défaut

  Object.entries(scores).forEach(([context, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedContext = context as SimulationContext;
    }
  });

  // Si aucun mot-clé trouvé, utiliser feedback par défaut
  return maxScore > 0 ? detectedContext : "feedback";
}
