/**
 * Lazy Motion - Wrapper pour lazy load framer-motion
 *
 * framer-motion est lazy loaded pour réduire le bundle initial
 *
 * Les animations ne sont pas critiques au chargement initial,
 * donc on charge framer-motion seulement quand nécessaire.
 */
import React from "react";
export declare const motion: {
  div: (props: React.ComponentProps<"div">) => import("react/jsx-runtime").JSX.Element;
  span: (props: React.ComponentProps<"span">) => import("react/jsx-runtime").JSX.Element;
  button: (props: React.ComponentProps<"button">) => import("react/jsx-runtime").JSX.Element;
};
export declare const AnimatePresence: (
  props: React.PropsWithChildren<{ children?: React.ReactNode }>,
) => import("react/jsx-runtime").JSX.Element;
export declare const useMotionValue: React.LazyExoticComponent<React.ComponentType<unknown>>;
export declare const useTransform: React.LazyExoticComponent<React.ComponentType<unknown>>;
export declare const useAnimation: React.LazyExoticComponent<React.ComponentType<unknown>>;
export type PanInfo = import("framer-motion").PanInfo;
