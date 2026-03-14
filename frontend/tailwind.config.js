/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A6BCC',
        'primary-dark': '#0D3B6E',
        'primary-bright': '#2D7FE0',
        background: '#0A0A0F',
        surface: '#13131A',
        'surface-2': '#1C1C28',
        'surface-3': '#1A1A2E',
        border: 'rgba(26,107,204,0.18)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0AEC0',
        'text-dim': '#4A4F6A',
        'text-muted': '#7A8099',
        'accent-glow': '#1A6BCC33',
        destructive: '#EF4444',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Space Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 8px 25px rgba(26,107,204,0.35)',
      },
    },
  },
  plugins: [],
}
