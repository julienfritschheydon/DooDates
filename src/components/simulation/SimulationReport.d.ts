/**
 * SimulationReport - Rapport de simulation avec métriques et problèmes
 *
 * Affiche les résultats de la simulation : métriques globales,
 * problèmes détectés, et recommandations.
 */
import type { SimulationResult } from "../../types/simulation";
interface SimulationReportProps {
    /** Résultat de la simulation */
    result: SimulationResult;
    /** Questions du poll (pour afficher les titres) */
    questions?: Array<{
        id: string;
        title: string;
    }>;
    /** Callback fermeture */
    onClose: () => void;
    /** Callback export PDF (Pro) */
    onExportPdf?: () => void;
    /** Utilisateur Pro */
    isPro?: boolean;
    /** ID du poll (pour navigation vers chat IA) */
    pollId?: string;
}
export declare function SimulationReport({ result, questions, onClose, onExportPdf, isPro, pollId, }: SimulationReportProps): import("react/jsx-runtime").JSX.Element;
export {};
