/**
 * Variants Framer Motion réutilisables
 *
 * Ce fichier centralise toutes les animations pour garantir
 * une cohérence visuelle à travers toute l'application.
 *
 * Utilise un type import pour éviter de charger framer-motion au démarrage
 */
import type { Variants } from "framer-motion";
/**
 * Durées de transition standard
 */
export declare const durations: {
  readonly fast: 0.15;
  readonly normal: 0.2;
  readonly slow: 0.3;
  readonly slower: 0.5;
};
/**
 * Easing curves standard
 */
export declare const easings: {
  readonly easeOut: readonly [0, 0, 0.2, 1];
  readonly easeIn: readonly [0.4, 0, 1, 1];
  readonly easeInOut: readonly [0.4, 0, 0.2, 1];
  readonly spring: {
    readonly type: "spring";
    readonly stiffness: 300;
    readonly damping: 30;
  };
};
/**
 * Fade in simple
 */
export declare const fadeIn: Variants;
/**
 * Slide from bottom
 */
export declare const slideUp: Variants;
/**
 * Slide from top
 */
export declare const slideDown: Variants;
/**
 * Slide from right
 */
export declare const slideRight: Variants;
/**
 * Slide from left
 */
export declare const slideLeft: Variants;
/**
 * Scale in (zoom)
 */
export declare const scaleIn: Variants;
/**
 * Scale in avec spring (plus dynamique)
 */
export declare const scaleSpring: Variants;
/**
 * Rotation + fade (pour les icônes)
 */
export declare const rotateFade: Variants;
/**
 * Collapse/Expand (pour les accordéons)
 */
export declare const collapse: Variants;
/**
 * Stagger children (pour les listes)
 */
export declare const staggerContainer: Variants;
/**
 * Item pour stagger
 */
export declare const staggerItem: Variants;
/**
 * Shake (pour les erreurs)
 */
export declare const shake: Variants;
/**
 * Pulse (pour attirer l'attention)
 */
export declare const pulse: Variants;
/**
 * Bounce (pour les succès)
 */
export declare const bounce: Variants;
/**
 * Modal backdrop
 */
export declare const backdropFade: Variants;
/**
 * Modal content (combinaison scale + fade)
 */
export declare const modalContent: Variants;
/**
 * Slide drawer (from right)
 */
export declare const drawerRight: Variants;
/**
 * Slide drawer (from left)
 */
export declare const drawerLeft: Variants;
/**
 * Notification toast (slide from top-right)
 */
export declare const toastSlide: Variants;
