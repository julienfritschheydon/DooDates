import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"!**/TimeSlotSection.tsx",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		// Breakpoints personnalisés pour meilleure gestion mobile
		screens: {
			'xs': '475px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		// Tailles de police optimisées pour mobile (ÉCRASE les valeurs par défaut)
		fontSize: {
			'xs': ['0.7rem', { lineHeight: '1rem' }],      // Réduit de 0.75rem
			'sm': ['0.8rem', { lineHeight: '1.25rem' }],   // Réduit de 0.875rem
			'base': ['0.9rem', { lineHeight: '1.5rem' }],  // Réduit de 1rem
			'lg': ['1rem', { lineHeight: '1.75rem' }],     // Réduit de 1.125rem
			'xl': ['1.15rem', { lineHeight: '1.75rem' }],  // Réduit de 1.25rem
			'2xl': ['1.4rem', { lineHeight: '2rem' }],     // Réduit de 1.5rem
			'3xl': ['1.75rem', { lineHeight: '2.25rem' }], // Réduit de 1.875rem
			'4xl': ['2rem', { lineHeight: '2.5rem' }],     // Réduit de 2.25rem
			'5xl': ['2.5rem', { lineHeight: '1' }],
			'6xl': ['3rem', { lineHeight: '1' }],
			'7xl': ['3.5rem', { lineHeight: '1' }],
			'8xl': ['4.5rem', { lineHeight: '1' }],
			'9xl': ['6rem', { lineHeight: '1' }],
		},
		extend: {
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
				'geist': ['Geist', 'sans-serif'],
			},
			// Espacements optimisés pour mobile (padding/margin)
			spacing: {
				'mobile-xs': '0.25rem',  // 4px
				'mobile-sm': '0.5rem',   // 8px
				'mobile-md': '0.75rem',  // 12px
				'mobile-lg': '1rem',     // 16px
				'mobile-xl': '1.5rem',   // 24px
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// DooDates Brand Colors
				'doo-blue': {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49'
				},
				'doo-green': {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d'
				},
				'doo-purple': {
					50: '#faf5ff',
					100: '#f3e8ff',
					200: '#e9d5ff',
					300: '#d8b4fe',
					400: '#c084fc',
					500: '#a855f7',
					600: '#9333ea',
					700: '#7c3aed',
					800: '#6b21a8',
					900: '#581c87'
				}
			},
			backgroundImage: {
				'doo-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 50%, #22c55e 100%)',
				'doo-gradient-subtle': 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #f0fdf4 100%)',
				'chat-gradient': 'linear-gradient(135deg, #e0f2fe 0%, #e9d5ff 100%)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { opacity: '0', transform: 'translateX(20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'pulse-slow': 'pulse-slow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
