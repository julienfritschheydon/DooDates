/**
 * SimulationProgress - Barre de progression pendant la simulation
 *
 * Affiche la progression en temps réel pendant la génération
 * des réponses simulées.
 */
interface SimulationProgressProps {
  /** Nombre total de réponses à générer */
  total: number;
  /** Nombre de réponses générées */
  current: number;
  /** Temps écoulé (ms) */
  elapsedTime?: number;
}
export declare function SimulationProgress({
  total,
  current,
  elapsedTime,
}: SimulationProgressProps): import("react/jsx-runtime").JSX.Element;
export {};
