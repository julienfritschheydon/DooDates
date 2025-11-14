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

// Wrappers avec Suspense pour un fallback transparent
// eslint-disable-next-line react-refresh/only-export-components
export const motion = {
  div: (props: React.ComponentProps<typeof MotionDiv>) => (
    <Suspense fallback={<div {...props} />}>
      <MotionDiv {...props} />
    </Suspense>
  ),
  span: (props: React.ComponentProps<typeof MotionSpan>) => (
    <Suspense fallback={<span {...props} />}>
      <MotionSpan {...props} />
    </Suspense>
  ),
  button: (props: React.ComponentProps<typeof MotionButton>) => (
    <Suspense fallback={<button {...props} />}>
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
// eslint-disable-next-line react-refresh/only-export-components
export const useMotionValue = lazy(() => loadMotion().then((m) => ({ default: m.useMotionValue })));

// eslint-disable-next-line react-refresh/only-export-components
export const useTransform = lazy(() => loadMotion().then((m) => ({ default: m.useTransform })));

// eslint-disable-next-line react-refresh/only-export-components
export const useAnimation = lazy(() => loadMotion().then((m) => ({ default: m.useAnimation })));

// Type pour PanInfo
export type PanInfo = import("framer-motion").PanInfo;
