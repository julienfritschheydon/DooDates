/**
 * Hook de gestion de l'affichage et de la conversion des créateurs de polls.
 *
 * Gère l'état d'affichage du PollCreator (Date ou Form) et la conversion
 * des suggestions Gemini en formats utilisables par les créateurs.
 *
 * @example
 * ```tsx
 * const pollManagement = usePollManagement();
 *
 * // Ouvrir le créateur avec une suggestion
 * pollManagement.openPollCreator(geminiSuggestion);
 *
 * // Vérifier le type
 * if (pollManagement.isFormPoll) {
 *   const draft = pollManagement.getFormDraft();
 * }
 *
 * // Fermer le créateur
 * pollManagement.closePollCreator();
 * ```
 *
 * @module hooks/usePollManagement
 */
import type { PollSuggestion } from "../lib/gemini";
import type { FormPollDraft } from "../components/polls/FormPollCreator";
/**
 * Hook de gestion des créateurs de polls (Date et Form).
 *
 * @returns Objet avec état et fonctions de gestion
 * @returns {boolean} showPollCreator - Indique si le créateur est affiché
 * @returns {PollSuggestion | null} selectedPollData - Données du poll sélectionné
 * @returns {boolean} isFormPoll - True si c'est un Form Poll
 * @returns {Function} openPollCreator - Ouvre le créateur avec des données
 * @returns {Function} closePollCreator - Ferme le créateur
 * @returns {Function} getFormDraft - Récupère le draft Form converti
 */
export declare function usePollManagement(): {
  showPollCreator: boolean;
  selectedPollData: PollSuggestion;
  openPollCreator: (pollData: PollSuggestion) => void;
  closePollCreator: () => void;
  getFormDraft: () => FormPollDraft | null;
  isFormPoll: boolean;
};
