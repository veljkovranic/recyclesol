import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Recycle Sol - Eco-friendly theme with light greens
        recycle: {
          // Backgrounds
          bg: '#f8fdf9',
          'bg-alt': '#f0f9f2',
          card: '#ffffff',
          'card-hover': '#f5fbf6',
          border: '#d4e8d9',
          'border-hover': '#a8d4b4',
          // Primary - Sage/Forest green
          primary: '#2d8a4e',
          'primary-light': '#3da564',
          'primary-dark': '#1f6b3a',
          // Secondary - Teal accent
          secondary: '#0d9488',
          'secondary-light': '#14b8a6',
          // Status colors
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          // Text colors
          text: '#1a2e23',
          'text-secondary': '#4a6b56',
          'text-muted': '#7a9985',
          // Dark mode variants (for cards/accents)
          dark: '#1a2e23',
          'dark-card': '#243d2e',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'leaf-fall': 'leaf-fall 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'leaf-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(10px) rotate(15deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'eco': '0 4px 20px rgba(45, 138, 78, 0.08)',
        'eco-lg': '0 8px 40px rgba(45, 138, 78, 0.12)',
        'eco-xl': '0 20px 60px rgba(45, 138, 78, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
