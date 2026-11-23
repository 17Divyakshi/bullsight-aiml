/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        sidebar: 'var(--bg-sidebar)',
        surface: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        hoverSurface: 'var(--bg-hover)',
        navy: {
          950: '#070B1A',
          900: '#10182B',
          850: '#151F36',
          800: '#1B2845',
        },
        bull: {
          DEFAULT: '#31E981',
          soft: 'rgba(49, 233, 129, 0.14)',
        },
        electric: {
          DEFAULT: '#4D8DFF',
          soft: 'rgba(77, 141, 255, 0.15)',
        },
        cyanGlow: {
          DEFAULT: '#38D9F5',
          soft: 'rgba(56, 217, 245, 0.15)',
        },
        violetAccent: {
          DEFAULT: '#9065FF',
          soft: 'rgba(144, 101, 255, 0.15)',
        },
        bear: {
          DEFAULT: '#FF586A',
          soft: 'rgba(255, 88, 106, 0.14)',
        },
        // Semantic aliases mapped to cinematic dark fintech tokens
        emerald: {
          DEFAULT: '#31E981',
          bright: '#38D9F5',
          400: '#5EF2A0',
          500: '#31E981',
          600: '#1FC768',
        },
        cyan: {
          400: '#38D9F5',
          500: '#22C3E6',
        },
        blue: {
          400: '#6EA3FF',
          500: '#4D8DFF',
          600: '#3574E2',
        },
        purple: {
          400: '#A987FF',
          500: '#9065FF',
          600: '#7546EA',
        },
        positive: '#31E981',
        negative: '#FF586A',
        warning: '#FBBF24',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        border: 'var(--border-color)',
        borderSubtle: 'var(--border-subtle)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(3, 6, 18, 0.72), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
        cardHover: '0 18px 40px -12px rgba(77, 141, 255, 0.22), 0 0 0 1px rgba(56, 217, 245, 0.22)',
        bullGlow: '0 8px 28px -6px rgba(49, 233, 129, 0.36)',
        blueGlow: '0 8px 28px -6px rgba(77, 141, 255, 0.35)',
        cyanGlow: '0 8px 28px -6px rgba(56, 217, 245, 0.32)',
      },
    },
  },
  plugins: [],
};
