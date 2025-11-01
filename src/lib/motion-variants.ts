/**
 * Variants Framer Motion réutilisables
 * 
 * Ce fichier centralise toutes les animations pour garantir
 * une cohérence visuelle à travers toute l'application.
 */

import { Variants } from "framer-motion";

/**
 * Durées de transition standard
 */
export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const;

/**
 * Easing curves standard
 */
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;

/**
 * Fade in simple
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.normal } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

/**
 * Slide from bottom
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: durations.fast },
  },
};

/**
 * Slide from top
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast },
  },
};

/**
 * Slide from right
 */
export const slideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: durations.fast },
  },
};

/**
 * Slide from left
 */
export const slideLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: durations.fast },
  },
};

/**
 * Scale in (zoom)
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
};

/**
 * Scale in avec spring (plus dynamique)
 */
export const scaleSpring: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.slow,
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: durations.fast },
  },
};

/**
 * Rotation + fade (pour les icônes)
 */
export const rotateFade: Variants = {
  initial: { opacity: 0, rotate: -10 },
  animate: {
    opacity: 1,
    rotate: 0,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    rotate: 10,
    transition: { duration: durations.fast },
  },
};

/**
 * Collapse/Expand (pour les accordéons)
 */
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

/**
 * Stagger children (pour les listes)
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Item pour stagger
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: durations.fast },
  },
};

/**
 * Shake (pour les erreurs)
 */
export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

/**
 * Pulse (pour attirer l'attention)
 */
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Bounce (pour les succès)
 */
export const bounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.5,
      ease: easings.easeOut,
    },
  },
};

/**
 * Modal backdrop
 */
export const backdropFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.fast } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

/**
 * Modal content (combinaison scale + fade)
 */
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: durations.fast },
  },
};

/**
 * Slide drawer (from right)
 */
export const drawerRight: Variants = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: {
      duration: durations.slow,
      ease: easings.easeOut,
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: durations.normal,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide drawer (from left)
 */
export const drawerLeft: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: 0,
    transition: {
      duration: durations.slow,
      ease: easings.easeOut,
    },
  },
  exit: {
    x: "-100%",
    transition: {
      duration: durations.normal,
      ease: easings.easeIn,
    },
  },
};

/**
 * Notification toast (slide from top-right)
 */
export const toastSlide: Variants = {
  initial: { opacity: 0, x: 100, y: 0 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: durations.fast,
      ease: easings.easeIn,
    },
  },
};
