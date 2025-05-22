module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // so all your theme objects are scanned
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Optionally, add any classes you use dynamically in your theme objects
  ],
  corePlugins: {
    preflight: false, // Optional: disables Tailwind's base styles if you want only utilities
  },
};