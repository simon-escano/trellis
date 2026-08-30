/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        trellis: {
          950: '#070A0F',
          900: '#0D1420',
          850: '#111A29',
          800: '#1E293B',
          700: '#334155',
          bg: '#070A0F',
          surface: '#0D1420',
          border: '#1E293B',
          accent: '#00E599',
          cyan: '#38BDF8',
          amber: '#F59E0B',
          rose: '#F43F5E',
        },
      },
    },
  },
  plugins: [],
};
