/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,md,mdx}",
    "./content/**/*.{md,mdx}",
    "./components/**/*.{ts,tsx}",
    "../packages/ui/src/**/*.{ts,tsx}"
  ],
  darkMode: "class",
  theme: { extend: {} },
  plugins: []
};
