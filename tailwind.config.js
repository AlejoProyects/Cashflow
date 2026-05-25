/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    'rgb(var(--bg-base)    / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elevated:'rgb(var(--bg-elevated)/ <alpha-value>)',
          hover:   'rgb(var(--bg-hover)   / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--p) / <alpha-value>)',
          light:   'rgb(var(--pl) / <alpha-value>)',
          dark:    'rgb(var(--pd) / <alpha-value>)',
        },
        accent: {
          cyan: 'rgb(var(--ac) / <alpha-value>)',
          pink: '#ec4899',
        },
        success: '#10b981',
        danger: '#f43f5e',
        warning: '#f59e0b',
        txt: {
          primary: '#f1f0ff',
          secondary: '#a09dc0',
          muted: '#6b6890',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
