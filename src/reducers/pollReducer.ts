/**
 * Poll Reducer - Gestion centralisée de l'état du sondage
 * 
 * Actions supportées :
 * - ADD_DATE : Ajouter une date au sondage
 * - REMOVE_DATE : Retirer une date du sondage
 * - UPDATE_TITLE : Modifier le titre du sondage
 * - ADD_TIMESLOT : Ajouter un créneau horaire à une date
 * - REPLACE_POLL : Remplacer complètement le sondage
 */

import { Poll } from "../types/poll";
import { convertGeminiSlotToInternal } from "../services/TimeSlotConverter";

// Types d'actions
export type PollAction = 
  | { type: 'ADD_DATE'; payload: string }
  | { type: 'REMOVE_DATE'; payload: string }
  | { type: 'UPDATE_TITLE'; payload: string }
  | { type: 'ADD_TIMESLOT'; payload: { date: string; start: string; end: string } }
  | { type: 'REPLACE_POLL'; payload: Poll };

/**
 * Reducer pour gérer les modifications du sondage
 */
export function pollReducer(state: Poll | null, action: PollAction): Poll | null {
  switch (action.type) {
    case 'REPLACE_POLL': {
      // Remplacer complètement le sondage (utilisé pour l'initialisation)
      return action.payload;
    }

    case 'ADD_DATE': {
      if (!state) return null;
      const newDate = action.payload;
      
      // Vérifier si la date existe déjà
      if (state.dates?.includes(newDate)) {
        return state; // Pas de changement
      }

      // Ajouter la date et trier
      const updatedDates = [...(state.dates || []), newDate].sort();

      return {
        ...state,
        dates: updatedDates,
        updated_at: new Date().toISOString(),
      };
    }

    case 'REMOVE_DATE': {
      if (!state) return null;
      const dateToRemove = action.payload;
      
      // Vérifier si la date existe
      if (!state.dates?.includes(dateToRemove)) {
        return state; // Date non trouvée, pas de changement
      }

      // Retirer la date
      const updatedDates = state.dates.filter(date => date !== dateToRemove);

      return {
        ...state,
        dates: updatedDates,
        updated_at: new Date().toISOString(),
      };
    }

    case 'UPDATE_TITLE': {
      if (!state) return null;
      const newTitle = action.payload.trim();
      
      // Vérifier que le titre n'est pas vide
      if (!newTitle) {
        return state; // Pas de changement si titre vide
      }

      return {
        ...state,
        title: newTitle,
        updated_at: new Date().toISOString(),
      };
    }

    case 'ADD_TIMESLOT': {
      if (!state) return null;
      const { date, start, end } = action.payload;
      
      // Ajouter automatiquement la date si elle n'existe pas
      const dates = state.dates || [];
      const updatedDates = dates.includes(date) 
        ? dates 
        : [...dates, date].sort();

      // Utiliser la même logique de conversion que Gemini (code réutilisé)
      const newSlot = convertGeminiSlotToInternal({ start, end });

      // Récupérer ou initialiser settings.timeSlotsByDate
      const currentSettings = state.settings || {};
      const currentTimeSlots = (currentSettings as any).timeSlotsByDate || {};
      const dateSlots = currentTimeSlots[date] || [];
      
      // Récupérer la granularité actuelle (défaut: 60 min)
      const granularity = (currentSettings as any).timeGranularity || 60;

      // Découper le slot en plusieurs petits slots selon la granularité
      // Exemple: slot 10h-11h (60min) avec granularité 30min → 2 slots de 30min
      const slotsToAdd: any[] = [];
      const startMinutes = newSlot.hour * 60 + newSlot.minute;
      const endMinutes = startMinutes + newSlot.duration;
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += granularity) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        
        // Vérifier si ce slot existe déjà
        const exists = dateSlots.some(
          (slot: any) => slot.hour === hour && slot.minute === minute
        );
        
        if (!exists) {
          slotsToAdd.push({
            hour,
            minute,
            duration: Math.min(granularity, endMinutes - minutes), // Durée du slot (peut être < granularité pour le dernier)
            enabled: true,
          });
        }
      }

      if (slotsToAdd.length === 0) {
        return state; // Tous les slots existent déjà
      }

      // Ajouter les nouveaux slots
      const updatedDateSlots = [...dateSlots, ...slotsToAdd];

      return {
        ...state,
        dates: updatedDates, // Mettre à jour les dates
        settings: {
          ...currentSettings,
          timeSlotsByDate: {
            ...currentTimeSlots,
            [date]: updatedDateSlots,
          },
        } as any,
        updated_at: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}
