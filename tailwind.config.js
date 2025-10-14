/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // AI 相關色彩（橙色系）
        ai: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // 漸變色彩
        gradient: {
          'ai-primary': 'from-orange-500 to-red-500',
          'ai-reverse': 'from-red-400 to-orange-600',
          'primary': 'from-blue-500 to-indigo-600',
        }
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.slider': {
          '&::-webkit-slider-thumb': {
            'appearance': 'none',
            'height': '20px',
            'width': '20px',
            'border-radius': '50%',
            'background': '#f97316', // ai-500
            'cursor': 'pointer',
            'border': '2px solid #ffffff',
            'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
          '&::-moz-range-thumb': {
            'height': '20px',
            'width': '20px',
            'border-radius': '50%',
            'background': '#f97316', // ai-500
            'cursor': 'pointer',
            'border': '2px solid #ffffff',
            'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-slider-track': {
            'height': '8px',
            'border-radius': '4px',
            'background': '#e5e7eb', // gray-200
          },
          '&::-moz-range-track': {
            'height': '8px',
            'border-radius': '4px',
            'background': '#e5e7eb', // gray-200
          },
        }
      })
    }
  ],
}