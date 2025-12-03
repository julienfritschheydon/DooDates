import { secureGeminiService } from "@/services/SecureGeminiService";
import { logger } from "./logger";
import { logError, ErrorFactory } from "./error-handling";

const MODEL = "gemini-2.0-flash"; // Aligned with Edge Function model

export interface ParsedAvailability {
  day: string; // "monday", "tuesday", etc.
  timeRange: {
    start: string; // "09:00"
    end: string; // "12:00"
  };
  confidence: number; // 0-1
  originalText?: string; // Texte original qui a généré cette disponibilité
}

export interface ParsedAvailabilitiesResult {
  availabilities: ParsedAvailability[];
  rawText: string;
  parsedAt: string;
  confidence: number; // Confiance globale (0-1)
  errors?: string[];
}

/**
 * Parse les disponibilités texte libre en utilisant Gemini via Edge Function
 *
 * Exemples d'entrées :
 * - "Disponible mardi et jeudi après-midi"
 * - "Libre la semaine prochaine sauf vendredi"
 * - "Tous les matins de 9h à 12h"
 * - "Lundi 14h, mercredi 10h ou 15h"
 */
export async function parseAvailabilitiesWithAI(text: string): Promise<ParsedAvailabilitiesResult> {
  try {
    const prompt = `Tu es un assistant spécialisé dans l'analyse de disponibilités temporelles.

Analyse le texte suivant et extrais toutes les disponibilités mentionnées. Retourne UNIQUEMENT un JSON valide, sans texte supplémentaire.

Format de réponse attendu :
{
  "availabilities": [
    {
      "day": "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
      "timeRange": {
        "start": "HH:MM",
        "end": "HH:MM"
      },
      "confidence": 0.0-1.0,
      "originalText": "extrait du texte original"
    }
  ],
  "confidence": 0.0-1.0
}

Règles :
- Utilise les jours en anglais (monday, tuesday, etc.)
- Pour "matin" : 09:00-12:00
- Pour "après-midi" : 14:00-18:00
- Pour "soir" : 18:00-21:00
- Si une heure précise est mentionnée, utilise-la
- Si plusieurs jours sont mentionnés, crée une entrée par jour
- Si "semaine prochaine" est mentionné, utilise la semaine suivante à partir d'aujourd'hui
- confidence : 1.0 si très clair, 0.7 si ambigu, 0.5 si incertain

Texte à analyser :
"${text}"

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    logger.debug("Parsing disponibilités avec Gemini (via SecureService)", "calendar", {
      textLength: text.length,
      model: MODEL,
    });

    // Utiliser le service sécurisé qui passe par l'Edge Function
    const result = await secureGeminiService.generateContent("", prompt);

    if (!result.success || !result.data) {
      throw ErrorFactory.api(result.message || result.error || "Erreur lors de l'appel à Gemini", "Erreur lors de l'analyse des disponibilités");
    }

    const responseText = result.data;

    logger.debug("Réponse Gemini reçue", "calendar", {
      responseLength: responseText.length,
    });

    // Extraire le JSON de la réponse (peut contenir du markdown)
    let jsonText = responseText.trim();

    // Supprimer les markdown code blocks si présents
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    jsonText = jsonText.trim();

    // Parser le JSON
    const parsed = JSON.parse(jsonText);

    // Valider et normaliser la structure
    const availabilities: ParsedAvailability[] = (parsed.availabilities || []).map(
      (avail: Record<string, unknown>) => ({
        day: normalizeDay(avail.day as string),
        timeRange: {
          start: normalizeTime((avail.timeRange as any)?.start || avail.start || "09:00"),
          end: normalizeTime((avail.timeRange as any)?.end || avail.end || "17:00"),
        },
        confidence: Math.max(0, Math.min(1, (avail.confidence as number) || 0.7)),
        originalText: (avail.originalText as string) || text.substring(0, 50),
      }),
    );

    // Calculer la confiance globale
    const globalConfidence =
      availabilities.length > 0
        ? availabilities.reduce((sum, a) => sum + a.confidence, 0) / availabilities.length
        : parsed.confidence || 0.5;

    logger.info("Disponibilités parsées avec succès", "calendar", {
      count: availabilities.length,
      confidence: globalConfidence,
    });

    return {
      availabilities,
      rawText: text,
      parsedAt: new Date().toISOString(),
      confidence: globalConfidence,
    };
  } catch (error) {
    logError(error, {
      component: "calendar",
      operation: "parseAvailabilitiesWithAI",
      metadata: { text: text.substring(0, 100) },
    });

    return {
      availabilities: [],
      rawText: text,
      parsedAt: new Date().toISOString(),
      confidence: 0,
      errors: [error instanceof Error ? error.message : "Erreur inconnue"],
    };
  }
}

/**
 * Normalise le nom du jour (français → anglais, casse)
 */
function normalizeDay(day: string): string {
  const dayMap: Record<string, string> = {
    lundi: "monday",
    mardi: "tuesday",
    mercredi: "wednesday",
    jeudi: "thursday",
    vendredi: "friday",
    samedi: "saturday",
    dimanche: "sunday",
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
    saturday: "saturday",
    sunday: "sunday",
  };

  const normalized = day.toLowerCase().trim();
  return dayMap[normalized] || normalized;
}

/**
 * Normalise le format de l'heure (HH:MM)
 */
function normalizeTime(time: string): string {
  // Supprimer les espaces
  time = time.trim();

  // Si format "9h" ou "9h00", convertir en "09:00"
  const hourMatch = time.match(/(\d{1,2})h(?:\s*(\d{2}))?/i);
  if (hourMatch) {
    const hour = hourMatch[1].padStart(2, "0");
    const minute = hourMatch[2] || "00";
    return `${hour}:${minute}`;
  }

  // Si format "9:00" ou "09:00", vérifier et normaliser
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, "0");
    const minute = timeMatch[2];
    return `${hour}:${minute}`;
  }

  // Format par défaut si non reconnu
  logger.warn("Format d'heure non reconnu", "calendar", { time });
  return "09:00";
}

/**
 * Parse simple sans IA (fallback) - extraction basique de patterns
 */
export function parseAvailabilitiesSimple(text: string): ParsedAvailabilitiesResult {
  const availabilities: ParsedAvailability[] = [];
  const errors: string[] = [];

  // Patterns simples pour extraction basique
  const dayPatterns = [
    { pattern: /lundi|monday/i, day: "monday" },
    { pattern: /mardi|tuesday/i, day: "tuesday" },
    { pattern: /mercredi|wednesday/i, day: "wednesday" },
    { pattern: /jeudi|thursday/i, day: "thursday" },
    { pattern: /vendredi|friday/i, day: "friday" },
    { pattern: /samedi|saturday/i, day: "saturday" },
    { pattern: /dimanche|sunday/i, day: "sunday" },
  ];

  const timePatterns = [
    { pattern: /matin|morning/i, start: "09:00", end: "12:00" },
    { pattern: /après-midi|afternoon/i, start: "14:00", end: "18:00" },
    { pattern: /soir|evening/i, start: "18:00", end: "21:00" },
  ];

  // Extraire les jours mentionnés
  const mentionedDays = dayPatterns.filter((dp) => dp.pattern.test(text)).map((dp) => dp.day);

  // Extraire les plages horaires mentionnées
  const mentionedTimes = timePatterns.find((tp) => tp.pattern.test(text));

  if (mentionedDays.length === 0) {
    errors.push("Aucun jour de la semaine détecté");
  }

  // Créer les disponibilités
  mentionedDays.forEach((day) => {
    availabilities.push({
      day,
      timeRange: mentionedTimes
        ? { start: mentionedTimes.start, end: mentionedTimes.end }
        : { start: "09:00", end: "17:00" }, // Par défaut journée complète
      confidence: 0.6, // Confiance plus faible pour parsing simple
      originalText: text.substring(0, 50),
    });
  });

  return {
    availabilities,
    rawText: text,
    parsedAt: new Date().toISOString(),
    confidence: availabilities.length > 0 ? 0.6 : 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
