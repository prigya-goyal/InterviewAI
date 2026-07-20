/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
      },
      colors: {
        // Base surfaces — deep navy-black, not pure black, so cards can sit
        // on top of it with real depth instead of a flat void.
        base: {
          DEFAULT: '#080B10',
          50: '#F5F7FA',
        },
        surface: {
          DEFAULT: '#0F141C',
          raised: '#161C27',
          overlay: '#1D2430',
        },
        border: {
          DEFAULT: '#232B38',
          subtle: '#181F2A',
        },
        // Primary accent: "compile success" mint — deliberately not the
        // generic violet/terracotta AI palette. Reads as a terminal OK signal.
        mint: {
          DEFAULT: '#00E6A0',
          soft: '#0FF0B4',
          dim: '#0A8F63',
        },
        // Secondary accent for AI-interview specific surfaces
        signal: {
          DEFAULT: '#7C8CFF',
          soft: '#A6B1FF',
        },
        // XP / streak / gamification accent
        amber: {
          DEFAULT: '#FFB454',
          dim: '#B87F2E',
        },
        difficulty: {
          easy: '#2ED573',
          medium: '#FFB454',
          hard: '#FF5C5C',
        },
        ink: {
          DEFAULT: '#E7ECF3',
          muted: '#8B96A8',
          faint: '#5A6478',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,230,160,0.15), 0 0 24px rgba(0,230,160,0.08)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgba(8,11,16,1)), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '100% 100%, 32px 32px, 32px 32px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'pulse-mint': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        'pulse-mint': 'pulse-mint 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
