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
        // Page-level surfaces
        canvas: '#f8f7ff', // primary background, warm off-white
        wash: '#f0eeff', // alternating section background
        surface: '#ffffff', // cards
        // Text scale (warm purple-tinted near-blacks)
        ink: {
          900: '#0f0d1a',
          800: '#1d1a30',
          700: '#2a2640',
          600: '#4a4862',
          500: '#6b6880',
          400: '#8e8ba6',
          300: '#bcb9cf',
          200: '#dcd9ec',
          100: '#eae7f6',
          50: '#f4f2fb',
        },
        // Brand purple
        accent: {
          DEFAULT: '#6d4aff',
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4caff',
          300: '#b8a8ff',
          400: '#9b80ff',
          500: '#7c5cff',
          600: '#6d4aff',
          700: '#5a37e0',
          800: '#4729b3',
          900: '#341e80',
        },
      },
      animation: {
        'fade-in': 'fadeIn 320ms ease-out forwards',
        'slide-up': 'slideUp 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
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
        // Whisper-soft elevation, tuned for light backgrounds
        card: '0 1px 3px rgba(15, 13, 26, 0.05), 0 6px 20px -6px rgba(15, 13, 26, 0.07)',
        'card-hover': '0 1px 3px rgba(15, 13, 26, 0.06), 0 14px 32px -8px rgba(15, 13, 26, 0.10)',
        glow: '0 4px 14px rgba(109, 74, 255, 0.30), 0 8px 24px -8px rgba(109, 74, 255, 0.35)',
        'glow-strong':
          '0 6px 18px rgba(109, 74, 255, 0.42), 0 14px 32px -8px rgba(109, 74, 255, 0.50)',
        soft: '0 8px 28px -12px rgba(15, 13, 26, 0.18)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
