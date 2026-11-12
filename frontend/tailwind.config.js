/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0C',
        foreground: '#F4F4F6',
        card: {
          DEFAULT: '#121216',
          foreground: '#F4F4F6',
        },
        primary: {
          DEFAULT: '#D4AF37', // Metallic Brushed Gold
          hover: '#B5942E',
          foreground: '#0A0A0C',
        },
        accent: {
          DEFAULT: '#E5C058',
          foreground: '#0A0A0C',
        },
        muted: {
          DEFAULT: '#1E1E24',
          foreground: '#8C8C9A',
        },
        border: 'hsl(240 5% 18% / 0.6)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
};

