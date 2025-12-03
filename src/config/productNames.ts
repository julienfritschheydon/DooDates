/**
 * Product Names Configuration
 * Centralized naming for the three DooDates products
 */

export const PRODUCT_NAMES = {
    DOODATES1: {
        id: 'doodates1',
        name: 'DooDates1',
        displayName: 'Sondages de Dates',
        route: '/date-polls', // Will become /doodates1
        color: 'blue',
        theme: {
            primary: 'blue-500',
            primaryHover: 'blue-600',
            border: 'blue-900/30',
            bg: 'blue-900/10',
        }
    },
    DOODATES2: {
        id: 'doodates2',
        name: 'DooDates2',
        displayName: 'Formulaires',
        route: '/form-polls', // Will become /doodates2
        color: 'violet',
        theme: {
            primary: 'violet-500',
            primaryHover: 'violet-600',
            border: 'violet-900/30',
            bg: 'violet-900/10',
        }
    },
    DOODATES3: {
        id: 'doodates3',
        name: 'DooDates3',
        displayName: 'Disponibilités',
        route: '/availability-polls', // Will become /doodates3
        color: 'emerald',
        theme: {
            primary: 'emerald-500',
            primaryHover: 'emerald-600',
            border: 'emerald-900/30',
            bg: 'emerald-900/10',
        }
    }
} as const;

export type ProductId = keyof typeof PRODUCT_NAMES;
