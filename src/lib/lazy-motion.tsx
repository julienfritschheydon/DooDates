/**
 * Lazy Motion - Wrapper pour lazy load framer-motion
 *
 * framer-motion est lazy loaded pour réduire le bundle initial
 *
 * Les animations ne sont pas critiques au chargement initial,
 * donc on charge framer-motion seulement quand nécessaire.
 */

import React, { lazy, Suspense, ComponentType } from "react";

// Cache du module pour éviter les rechargements
let motionModule: typeof import("framer-motion") | null = null;
let motionLoadingPromise: Promise<typeof import("framer-motion")> | null = null;

const loadMotion = async (): Promise<typeof import("framer-motion")> => {
  if (motionModule) {
    return motionModule;
  }

  if (motionLoadingPromise) {
    return motionLoadingPromise;
  }

  motionLoadingPromise = import("framer-motion").then((module) => {
    motionModule = module;
    return module;
  });

  return motionLoadingPromise;
};

// Lazy load des composants framer-motion
const MotionDiv = lazy(() => loadMotion().then((m) => ({ default: m.motion.div })));

const MotionSpan = lazy(() => loadMotion().then((m) => ({ default: m.motion.span })));

const MotionButton = lazy(() => loadMotion().then((m) => ({ default: m.motion.button })));

const AnimatePresenceComponent = lazy(() =>
  loadMotion().then((m) => ({ default: m.AnimatePresence })),
);

// Helper pour extraire uniquement les props HTML valides (sans les props framer-motion)
const getHtmlProps = <T extends Record<string, unknown>>(props: T): Record<string, unknown> => {
  const {
    animate,
    initial,
    exit,
    variants,
    transition,
    whileHover,
    whileTap,
    whileFocus,
    whileDrag,
    whileInView,
    drag,
    dragConstraints,
    dragElastic,
    dragMomentum,
    layout,
    layoutId,
    style, // style peut contenir MotionStyle
    ...htmlProps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = props as any;
  return htmlProps;
};

// Wrappers avec Suspense pour un fallback transparent
// eslint-disable-next-line react-refresh/only-export-components
export const motion = {
  div: (props: React.ComponentProps<typeof MotionDiv>) => (
    <Suspense fallback={<div {...getHtmlProps(props)} />}>
      <MotionDiv {...props} />
    </Suspense>
  ),
  span: (props: React.ComponentProps<typeof MotionSpan>) => (
    <Suspense fallback={<span {...getHtmlProps(props)} />}>
      <MotionSpan {...props} />
    </Suspense>
  ),
  button: (props: React.ComponentProps<typeof MotionButton>) => (
    <Suspense fallback={<button {...getHtmlProps(props)} data-testid="lazy-motion-button" />}>
      <MotionButton {...props} />
    </Suspense>
  ),
};

export const AnimatePresence = (props: React.ComponentProps<typeof AnimatePresenceComponent>) => (
  <Suspense fallback={props.children}>
    <AnimatePresenceComponent {...props} />
  </Suspense>
);

// Export des autres utilitaires framer-motion (chargés quand nécessaire)
// Note: Les hooks ne peuvent pas être lazy-loaded, on exporte des fonctions async à la place
// eslint-disable-next-line react-refresh/only-export-components
export const getMotionValue = async () => {
  const m = await loadMotion();
  return m.useMotionValue;
};

// eslint-disable-next-line react-refresh/only-export-components
export const getTransform = async () => {
  const m = await loadMotion();
  return m.useTransform;
};

// eslint-disable-next-line react-refresh/only-export-components
export const getAnimation = async () => {
  const m = await loadMotion();
  return m.useAnimation;
};

// Type pour PanInfo
export type PanInfo = import("framer-motion").PanInfo;
