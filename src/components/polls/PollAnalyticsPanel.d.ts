/**
 * Poll Analytics Panel - Interface pour les analytics conversationnels
 *
 * Permet d'interroger les résultats d'un sondage en langage naturel
 * et affiche les insights automatiques générés par l'IA.
 */
interface Props {
    pollId: string;
    pollTitle: string;
}
export default function PollAnalyticsPanel({ pollId, pollTitle }: Props): import("react/jsx-runtime").JSX.Element;
export {};
