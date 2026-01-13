import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  // Exclude any folders named _deprecated from Vite's server and build
  server: {
    port: 3000,
    watch: {
      ignored: ['**/_deprecated/**']
    }
  },
  build: {
    rollupOptions: {
      external: ['**/_deprecated/**']
    }
  }
});
