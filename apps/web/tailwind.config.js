/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trellis: {
          bg: "#070A0F",
          surface: "#0D1420",
          "surface-card": "#111A2C",
          border: "#1E293B",
          "border-active": "#334155",
          "text-primary": "#F8FAFC",
          "text-muted": "#94A3B8",
          accent: "#00E599",
          cyan: "#38BDF8",
          amber: "#F59E0B",
          rose: "#F43F5E",
          purple: "#A855F7",
        }
      },
      fontFamily: {
        sans: ["'DM Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      }
    },
  },
  plugins: [],
}
