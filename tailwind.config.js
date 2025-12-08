/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vero Color Palette - Clean naming without duplicates
        vero: {
          950: '#050505', // Deep black
          900: '#0a0a0a', // Card bg
          800: '#171717', // Input bg
          700: '#262626', // Borders
          600: '#404040',
        },
        'vero-accent': '#d4af37', // Gold
        'vero-accent-hover': '#e5c158', // Fixed naming convention
        'vero-danger': '#ef4444',
        'vero-success': '#10b981',
        'vero-blue': '#2563eb',
        
        // Design System Colors - Primary colors
        background: '#050505',
        surface: '#0A0A0A',
        'surface-highlight': '#121212', // Fixed naming convention
        border: '#1E1E1E',
        
        // Gold variants - Consistent naming
        gold: {
          DEFAULT: '#C5A065',
          dim: '#8C7040',
          light: '#E5C585',
          dark: '#8A6D3B',
        },
        
        // Trading status colors
        profit: '#2EBD85',
        loss: '#F6465D',
        
        // Text colors - Clean naming without duplicates
        'text-primary': '#FFFFFF',
        'text-secondary': '#E5E5E5',
        'text-tertiary': '#CCCCCC',
        'text-muted': '#999999',
        'text-disabled': '#666666',
        
        // Status colors - Clean naming
        'success-bg': '#064E3B',
        'warning': '#F59E0B',
        'warning-bg': '#451A03',
        'error': '#EF4444',
        'error-bg': '#7F1D1D',
        'info': '#3B82F6',
        'info-bg': '#1E3A8A',
        
        // Border colors - Clean naming
        'border-primary': 'rgba(184, 155, 94, 0.3)',
        'border-secondary': 'rgba(255, 255, 255, 0.1)',
        'border-tertiary': 'rgba(255, 255, 255, 0.05)',
        
        // Legacy compatibility - Minimal set
        primary: '#C0C0C0',
        foreground: 'var(--foreground)',
      },
      animation: {
        'gradient': 'gradientShift 18s ease infinite',
        'fade-in': 'fade-in 0.3s ease-out', // Clean naming
        'slide-in-left': 'slide-in-left 0.3s ease-out', // Clean naming
        'pulse': 'pulse 2s ease-in-out infinite', // Clean naming
        'border-beam': 'border-beam calc(var(--duration) * 1) infinite linear',
        'text-reveal': 'text-reveal 1s cubic-bezier(0.77, 0, 0.175, 1) forwards',
        'clip-reveal': 'clip-reveal 1s cubic-bezier(0.77, 0, 0.175, 1) forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'border-beam': {
          '100%': {
            'offset-distance': '100%',
          }
        },
        'text-reveal': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          }
        },
        'clip-reveal': {
          '0%': {
            clipPath: 'inset(0 100% 0 0)',
          },
          '100%': {
            clipPath: 'inset(0 0 0 0)',
          }
        }
      },
      fontFamily: {
        // Clean font families without duplicates
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'text-xs': '0.75rem',    /* 12px - Clean naming */
        'text-sm': '0.875rem',   /* 14px */
        'text-base': '1rem',      /* 16px */
        'text-lg': '1.125rem',    /* 18px */
        'text-xl': '1.25rem',     /* 20px */
        'text-2xl': '1.5rem',     /* 24px */
        'text-3xl': '1.875rem',   /* 30px */
        'text-4xl': '2.25rem',    /* 36px */
      },
      fontWeight: {
        'font-light': '300',     // Clean naming
        'font-normal': '400',
        'font-medium': '500',
        'font-semibold': '600',
        'font-bold': '700',
      },
      spacing: {
        'spacing-1': '0.25rem',   /* 4px - Clean naming */
        'spacing-2': '0.5rem',    /* 8px */
        'spacing-3': '0.75rem',   /* 12px */
        'spacing-4': '1rem',      /* 16px */
        'spacing-5': '1.25rem',   /* 20px */
        'spacing-6': '1.5rem',    /* 24px */
        'spacing-8': '2rem',      /* 32px */
        'spacing-10': '2.5rem',   /* 40px */
        'spacing-12': '3rem',     /* 48px */
        'spacing-16': '4rem',     /* 64px */
        'spacing-20': '5rem',     /* 80px */
        'spacing-24': '6rem',     /* 96px */
      },
      borderRadius: {
        'radius-sm': '0.375rem',   /* 6px - Clean naming */
        'radius-md': '0.5rem',     /* 8px */
        'radius-lg': '0.75rem',    /* 12px */
        'radius-xl': '1rem',       /* 16px */
        'radius-2xl': '1.5rem',    /* 24px */
        'radius-full': '9999px',
      },
      boxShadow: {
        'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.5)', // Clean naming
        'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.3)',
        'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.25)',
        'shadow-2xl': '0 25px 50px rgba(0, 0, 0, 0.2)',
      },
      transitionDuration: {
        'duration-fast': '150ms', // Clean naming
        'duration-normal': '250ms',
        'duration-slow': '350ms',
      },
      zIndex: {
        'z-dropdown': '1000', // Clean naming
        'z-sticky': '1020',
        'z-fixed': '1030',
        'z-modal-backdrop': '1040',
        'z-modal': '1050',
        'z-popover': '1060',
        'z-tooltip': '1070',
        'z-toast': '1080',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
