/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C0C0C0',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'gradient': 'gradientShift 18s ease infinite',
      },
    },
  },
  plugins: [],
}
