/**
 * Hook pour détecter les media queries responsive
 *
 * Usage:
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export declare function useMediaQuery(query: string): boolean;
