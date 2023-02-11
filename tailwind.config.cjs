/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["cupcake", "dracula", "luxury"],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
