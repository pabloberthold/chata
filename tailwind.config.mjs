/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#1a1a2e",
          50: "#e2e2f0",
          100: "#b5b5d6",
          200: "#8383b9",
          300: "#5a5a9e",
          400: "#3d3d8a",
          500: "#2a2a6e",
          600: "#1e1e56",
          700: "#1a1a2e",
          800: "#12121f",
          900: "#0a0a12",
        },
        primary: {
          DEFAULT: "#7c3aed",
          50: "#f5f0ff",
          100: "#ede1ff",
          200: "#dcc3ff",
          300: "#c9a4ff",
          400: "#b685ff",
          500: "#a366ff",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
