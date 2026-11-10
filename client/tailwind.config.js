/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb', // Primary Collegiate Royal Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          navy: '#0B132B', // Deep Oxford Navy
          dark: '#0F172A'  // Slate Dark
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          800: '#1E293B',
          900: '#0F172A',
          card: '#FFFFFF'
        },
        status: {
          open: '#059669',       // Emerald
          closed: '#DC2626',     // Crimson
          registered: '#2563EB', // Royal Blue
          pending: '#D97706'     // Amber
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      boxShadow: {
        ticket: '0 4px 20px -2px rgba(11, 19, 43, 0.08), 0 2px 6px -1px rgba(11, 19, 43, 0.04)',
        modal: '0 20px 40px -8px rgba(11, 19, 43, 0.24)'
      }
    },
  },
  plugins: [],
}
