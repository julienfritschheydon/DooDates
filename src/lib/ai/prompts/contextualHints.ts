/**
 * Génère des indices contextuels basés sur l'input utilisateur
 * Extrait de gemini.ts pour modularité
 */
export function buildContextualHints(userInput: string): string {
  const lowerInput = userInput.toLowerCase();
  const hints: string[] = [];

  // Détection des contextes spécifiques (par ordre de priorité)

  // Visite musée/exposition
  if (/visite.*musée|musée.*visite|visite.*exposition|exposition.*visite/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Visite au musée/exposition → Générer 2-3 créneaux entre 14h00 et 17h00 (durée 2-3h)",
    );
  }

  // Footing/course/jogging
  if (/footing|course|jogging|running/.test(lowerInput)) {
    hints.push("CONTEXTE: Activité sportive → Générer 1-2 créneaux courts (1h max)");
    if (/vendredi.*soir|soir.*vendredi/.test(lowerInput)) {
      hints.push("  - Vendredi soir: 18h00-19h00");
    }
    if (/samedi.*matin|matin.*samedi/.test(lowerInput)) {
      hints.push("  - Samedi matin: 08h00-09h00");
    }
  }

  // Visio/visioconférence
  if (/visio|visioconférence|visioconference/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Visioconférence → Générer maximum 2 créneaux entre 18h00 et 20h00 (durée 1h)",
    );
  }

  // Brunch
  if (/brunch/.test(lowerInput)) {
    hints.push("CONTEXTE: Brunch → Générer créneaux entre 11h30 et 13h00 (durée 90min)");
  }

  // Déjeuner/partenariats
  if (/déjeuner|dejeuner|partenariats/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Déjeuner/partenariats → Générer 2-3 créneaux entre 11h30 et 13h30 (durée 1h)",
    );
  }

  // Escape game
  if (/escape.*game|escape game/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Escape game → Générer créneaux en soirée entre 19h00 et 21h00 (durée 2h)",
    );
  }

  // Séance photo
  if (
    /photo|séance photo/.test(lowerInput) &&
    /dimanche/.test(lowerInput) &&
    /matin/.test(lowerInput)
  ) {
    hints.push(
      "CONTEXTE: Séance photo dimanche matin → Générer 2-3 créneaux entre 09h00 et 12h00 (durée 3h)",
    );
  }

  // Répétition chorale
  if (
    /chorale|répétition/.test(lowerInput) &&
    /samedi/.test(lowerInput) &&
    /dimanche/.test(lowerInput)
  ) {
    hints.push(
      "CONTEXTE: Répétition chorale → Générer 1 créneau samedi matin (10h-12h) et 1 créneau dimanche après-midi (15h-17h)",
    );
  }

  // Réunion parents-profs
  if (/parents?-?profs?/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Réunion parents-profs → Générer 2 créneaux en début de soirée (18h30-20h00, durée 90min)",
    );
  }

  // Aide aux devoirs
  if (/aide aux devoirs|devoirs/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Aide aux devoirs → Générer créneaux mercredi après-midi (17h-18h) ou vendredi soir (18h-19h)",
    );
  }

  // Distribution flyers
  if (/distribution.*flyers|flyers/.test(lowerInput)) {
    hints.push(
      "CONTEXTE: Distribution de flyers → Générer 2 créneaux (samedi matin 9h-11h + dimanche après-midi 14h-16h)",
    );
  }

  // Améliorer les plages horaires génériques
  if (/matin/.test(lowerInput) && !/brunch/.test(lowerInput)) {
    hints.push("CONTEXTE: Matin → Générer créneaux entre 09h00 et 12h00 (pas 8h-11h)");
  }

  if (/après-midi|apres-midi/.test(lowerInput)) {
    hints.push("CONTEXTE: Après-midi → Générer créneaux entre 14h00 et 17h00 (pas 15h-17h)");
  }

  // Soirée générique
  if (/soir|soirée|soiree/.test(lowerInput) && !/escape/.test(lowerInput)) {
    hints.push("CONTEXTE: Soirée → Générer créneaux entre 18h30 et 21h00");
  }

  // Durée explicite → OBLIGATOIRE de générer des timeSlots
  const durationMatch = lowerInput.match(/(\d+)\s*(minutes?|min|h|heures?)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    const durationMinutes = unit.startsWith("h") ? value * 60 : value;
    hints.push(
      `CONTEXTE: Durée explicite (${durationMinutes} min) → OBLIGATOIRE: Générer des timeSlots de ${durationMinutes} minutes`,
    );
  }

  // "créneau" mentionné → attente de timeSlots
  if (/créneau|creneau/.test(lowerInput)) {
    hints.push("CONTEXTE: 'créneau' mentionné → OBLIGATOIRE: Générer au moins 1 timeSlot");
  }

  return hints.length > 0
    ? `\n⚠️⚠️⚠️ HINTS CONTEXTUELS DÉTECTÉS ⚠️⚠️⚠️\n${hints.join("\n")}\nUtilise ces hints pour affiner la sélection des créneaux horaires.\n`
    : "";
}
