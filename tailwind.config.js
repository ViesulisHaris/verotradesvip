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
        // New Design System Colors
        background: '#050505',
        surface: '#0A0A0A',
        surfaceHighlight: '#121212',
        border: '#1E1E1E',
        
        // Gold variants
        gold: {
          DEFAULT: '#C5A065',
          dim: '#8C7040',
          light: '#E5C585',
          dark: '#8A6D3B',
        },
        
        // Trading status colors
        profit: '#2EBD85',
        loss: '#F6465D',
        
        // VeroTrade Design System Colors (Legacy)
        'verotrade-primary-black': '#0A0A0A',
        'verotrade-secondary-black': '#121212',
        'verotrade-tertiary-black': '#1A1A1A',
        'verotrade-quaternary-black': '#1F1F1F',
        'verotrade-quinary-black': '#252525',
        
        // Gold accents (Legacy)
        'verotrade-gold-primary': '#B89B5E',
        'verotrade-gold-secondary': '#D4B87F',
        'verotrade-gold-tertiary': '#E6D4A3',
        'verotrade-gold-quaternary': '#F5E6D3',
        
        // Text colors
        'verotrade-text-primary': '#FFFFFF',
        'verotrade-text-secondary': '#E5E5E5',
        'verotrade-text-tertiary': '#CCCCCC',
        'verotrade-text-muted': '#999999',
        'verotrade-text-disabled': '#666666',
        
        // Status colors
        'verotrade-success': '#10B981',
        'verotrade-success-bg': '#064E3B',
        'verotrade-warning': '#F59E0B',
        'verotrade-warning-bg': '#451A03',
        'verotrade-error': '#EF4444',
        'verotrade-error-bg': '#7F1D1D',
        'verotrade-info': '#3B82F6',
        'verotrade-info-bg': '#1E3A8A',
        
        // Border colors
        'verotrade-border-primary': 'rgba(184, 155, 94, 0.3)',
        'verotrade-border-secondary': 'rgba(255, 255, 255, 0.1)',
        'verotrade-border-tertiary': 'rgba(255, 255, 255, 0.05)',
        
        // Legacy compatibility
        primary: '#C0C0C0',
        foreground: 'var(--foreground)',
      },
      animation: {
        'gradient': 'gradientShift 18s ease infinite',
        'verotrade-fadeIn': 'verotrade-fadeIn 0.3s ease-out',
        'verotrade-slideInLeft': 'verotrade-slideInLeft 0.3s ease-out',
        'verotrade-pulse': 'verotrade-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'verotrade-fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'verotrade-slideInLeft': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'verotrade-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      fontFamily: {
        // New font families
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        
        // Legacy font families
        'verotrade-primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'verotrade-mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'verotrade-xs': '0.75rem',    /* 12px */
        'verotrade-sm': '0.875rem',   /* 14px */
        'verotrade-base': '1rem',      /* 16px */
        'verotrade-lg': '1.125rem',    /* 18px */
        'verotrade-xl': '1.25rem',     /* 20px */
        'verotrade-2xl': '1.5rem',     /* 24px */
        'verotrade-3xl': '1.875rem',   /* 30px */
        'verotrade-4xl': '2.25rem',    /* 36px */
      },
      fontWeight: {
        'verotrade-light': '300',
        'verotrade-normal': '400',
        'verotrade-medium': '500',
        'verotrade-semibold': '600',
        'verotrade-bold': '700',
      },
      spacing: {
        'verotrade-1': '0.25rem',   /* 4px */
        'verotrade-2': '0.5rem',    /* 8px */
        'verotrade-3': '0.75rem',   /* 12px */
        'verotrade-4': '1rem',      /* 16px */
        'verotrade-5': '1.25rem',   /* 20px */
        'verotrade-6': '1.5rem',    /* 24px */
        'verotrade-8': '2rem',      /* 32px */
        'verotrade-10': '2.5rem',   /* 40px */
        'verotrade-12': '3rem',     /* 48px */
        'verotrade-16': '4rem',     /* 64px */
        'verotrade-20': '5rem',     /* 80px */
        'verotrade-24': '6rem',     /* 96px */
      },
      borderRadius: {
        'verotrade-sm': '0.375rem',   /* 6px */
        'verotrade-md': '0.5rem',     /* 8px */
        'verotrade-lg': '0.75rem',    /* 12px */
        'verotrade-xl': '1rem',       /* 16px */
        'verotrade-2xl': '1.5rem',    /* 24px */
        'verotrade-full': '9999px',
      },
      boxShadow: {
        'verotrade-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'verotrade-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'verotrade-lg': '0 10px 15px rgba(0, 0, 0, 0.3)',
        'verotrade-xl': '0 20px 25px rgba(0, 0, 0, 0.25)',
        'verotrade-2xl': '0 25px 50px rgba(0, 0, 0, 0.2)',
      },
      transitionDuration: {
        'verotrade-fast': '150ms',
        'verotrade-normal': '250ms',
        'verotrade-slow': '350ms',
      },
      zIndex: {
        'verotrade-dropdown': '1000',
        'verotrade-sticky': '1020',
        'verotrade-fixed': '1030',
        'verotrade-modal-backdrop': '1040',
        'verotrade-modal': '1050',
        'verotrade-popover': '1060',
        'verotrade-tooltip': '1070',
        'verotrade-toast': '1080',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
