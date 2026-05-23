/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        ink: {
          950: '#07070b',
          900: '#0a0a0f',
          800: '#101019',
          700: '#161622',
          600: '#1c1c2b',
          500: '#252537',
          400: '#3a3a50',
        },
        accent: {
          DEFAULT: '#7c5cff',
          50: '#f3f0ff',
          100: '#e7e1ff',
          200: '#cfc1ff',
          300: '#b29aff',
          400: '#9276ff',
          500: '#7c5cff',
          600: '#6543e8',
          700: '#5234c0',
          800: '#3f2899',
          900: '#2c1c6e',
        },
      },
      animation: {
        'fade-in': 'fadeIn 320ms ease-out forwards',
        'slide-up': 'slideUp 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(124, 92, 255, 0.25), 0 12px 40px -8px rgba(124, 92, 255, 0.35)',
        'soft': '0 8px 28px -10px rgba(0, 0, 0, 0.6)',
        'card': '0 1px 0 0 rgba(255, 255, 255, 0.04) inset, 0 8px 32px -12px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
