
const sdkSafelist = require('@imminently/interview-sdk-theme-default/tailwind-safelist');

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/core/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/theme-default/src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: sdkSafelist,
  theme: { extend: {} },
  plugins: [],
};