/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'quantis': {
          'bg': '#0a0e17',
          'card': '#111827',
          'border': '#1e293b',
          'accent': '#10b981',
          'accent-hover': '#059669',
          'text': '#f1f5f9',
          'text-muted': '#94a3b8',
          'danger': '#ef4444',
          'warning': '#f59e0b',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}