/**
 * Hook pour déterminer si une route est active
 *
 * Usage:
 * const { isActive } = useActiveRoute();
 *
 * <NavLink className={isActive('/workspace') ? 'active' : ''}>
 */
export declare function useActiveRoute(): {
    isActive: (route: string, exact?: boolean) => boolean;
    pathname: string;
};
