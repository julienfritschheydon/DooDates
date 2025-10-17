import { useLocation } from 'react-router-dom';

/**
 * Hook pour déterminer si une route est active
 * 
 * Usage:
 * const { isActive } = useActiveRoute();
 * 
 * <NavLink className={isActive('/workspace') ? 'active' : ''}>
 */
export function useActiveRoute() {
  const location = useLocation();
  const pathname = location.pathname;

  /**
   * Vérifie si une route est active
   * 
   * @param route - Route à vérifier (ex: '/workspace', '/polls')
   * @param exact - Si true, match exact uniquement. Si false, match préfixe aussi
   */
  const isActive = (route: string, exact = false): boolean => {
    if (exact) {
      return pathname === route;
    }
    
    // Match exact OU préfixe (ex: /workspace/123 matche /workspace)
    return pathname === route || pathname.startsWith(route + '/');
  };

  return { isActive, pathname };
}
