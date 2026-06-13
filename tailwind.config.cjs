/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        "ducki-dark": {
          "primary": "#fbbf24", // Vibrant Ducki Amber
          "primary-focus": "#f59e0b",
          "primary-content": "#0f172a",
          "secondary": "#06b6d4", // Electric Cyan
          "secondary-focus": "#0891b2",
          "secondary-content": "#0f172a",
          "accent": "#fb7185", // Soft Rose
          "neutral": "#1e293b",
          "base-100": "#0b0f19", // Cosmic Space Black/Slate
          "base-200": "#111827", // Card Black
          "base-300": "#1f2937", // Card Highlight
          "base-content": "#f8fafc",
          "info": "#38bdf8",
          "success": "#10b981",
          "warning": "#fbbf24",
          "error": "#ef4444",
        },
        "ducki-light": {
          "primary": "#d97706",
          "primary-focus": "#b45309",
          "primary-content": "#ffffff",
          "secondary": "#0891b2",
          "secondary-focus": "#0e7490",
          "secondary-content": "#ffffff",
          "accent": "#db2777",
          "neutral": "#f3f4f6",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
          "base-content": "#0f172a",
          "info": "#0284c7",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "pastel",
      "dracula",
      "halloween",
    ],
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    require("tailwind-scrollbar-hide"),
  ],
};
