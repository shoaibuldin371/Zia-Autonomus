import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          dim: 'var(--surface-dim)',
          bright: 'var(--surface-bright)',
          container: {
            lowest: 'var(--surface-container-lowest)',
            low: 'var(--surface-container-low)',
            DEFAULT: 'var(--surface-container)',
            high: 'var(--surface-container-high)',
            highest: 'var(--surface-container-highest)',
          },
          variant: 'var(--surface-variant)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          indigo: '#5B5BF0',
          hover: '#4C4CE0',
        },
        'on-primary': {
          DEFAULT: 'var(--on-primary)',
          container: 'var(--on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          positive: '#22C55E',
        },
        'on-secondary': {
          DEFAULT: 'var(--on-secondary)',
          container: 'var(--on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          warning: '#F59E0B',
        },
        'on-tertiary': {
          DEFAULT: 'var(--on-tertiary)',
          container: 'var(--on-tertiary-container)',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
          alert: '#EF4444',
        },
        'on-error': {
          DEFAULT: 'var(--on-error)',
          container: 'var(--on-error-container)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        card: 'var(--card-bg)',
        elevated: 'var(--elevated-bg)',
        divider: 'var(--divider-color)',
        muted: '#64748B',
        subtext: '#94A3B8',
      },
      borderRadius: {
        card: '14px',
        control: '10px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(91, 91, 240, 0.35)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;

