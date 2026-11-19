/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        raised: 'var(--bg-raised)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          ink: 'var(--accent-ink)',
          text: 'var(--accent-text)',
        },
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        // Semantic UI mappings
        background: 'var(--bg-page)',
        foreground: 'var(--ink)',
        card: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--ink)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          foreground: 'var(--accent-ink)',
        },
          secondary: {
            DEFAULT: 'var(--bg-surface)',
            foreground: 'var(--ink)',
          },
          muted: {
            DEFAULT: 'var(--bg-surface)',
            foreground: 'var(--ink-muted)',
          },
          ring: 'var(--accent)',
        },
        fontFamily: {
          head: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
          body: ['"Inter"', 'system-ui', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
          sans: ['"Inter"', 'system-ui', 'sans-serif'],
        },
        borderRadius: {
          sm: 'var(--radius-sm)',
          md: 'var(--radius-md)',
          phone: 'var(--radius-phone)',
        },
      },
    },
    plugins: [],
  };

