interface PollPreviewProps {
  poll: import("../../lib/pollStorage").Poll;
}
/**
 * Composant Preview pour afficher l'interface d'édition du sondage
 * Utilise les composants existants PollCreator/FormPollCreator
 */
export declare function PollPreview({
  poll,
}: PollPreviewProps): import("react/jsx-runtime").JSX.Element;
export {};
