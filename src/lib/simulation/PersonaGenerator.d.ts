/**
 * PersonaGenerator - Génération de personas pour la simulation
 *
 * Définit 10 personas représentant différents types de répondants
 * selon le contexte d'usage du questionnaire.
 */
import type { Persona, SimulationContext } from "../../types/simulation";
declare const PERSONAS_PRINCIPAL: Persona[];
declare const PERSONAS_SECONDARY: Persona[];
/**
 * Liste complète des 10 personas
 */
export declare const ALL_PERSONAS: Persona[];
/**
 * Récupère un persona par son ID
 */
export declare function getPersonaById(id: string): Persona | undefined;
/**
 * Récupère tous les personas d'un contexte
 */
export declare function getPersonasByContext(context: SimulationContext): Persona[];
/**
 * Sélectionne un persona aléatoire pour un contexte
 */
export declare function selectRandomPersona(context: SimulationContext): Persona;
/**
 * Sélectionne N personas aléatoires pour un contexte
 * avec distribution équilibrée
 */
export declare function selectPersonas(context: SimulationContext, count: number): Persona[];
/**
 * Statistiques sur les personas
 */
export declare function getPersonaStats(): {
    total: number;
    principal: number;
    secondary: number;
    byContext: {
        context: string;
        count: number;
        personas: string[];
    }[];
    avgResponseRate: number;
    avgAttentionSpan: number;
};
export { PERSONAS_PRINCIPAL, PERSONAS_SECONDARY };
