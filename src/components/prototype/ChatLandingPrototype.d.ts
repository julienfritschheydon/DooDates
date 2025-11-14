/**
 * Chat Landing Prototype - Phase 6A: Intégration IA réelle
 *
 * Interface chat plein écran avec vraie IA Gemini
 * Remplace le dashboard quand feature flag AI_FIRST_UX est activé
 */
interface ChatLandingPrototypeProps {
  onPollCreated?: (poll: import("../../lib/pollStorage").Poll) => void;
}
export declare function ChatLandingPrototype({
  onPollCreated,
}: ChatLandingPrototypeProps): import("react/jsx-runtime").JSX.Element;
export {};
