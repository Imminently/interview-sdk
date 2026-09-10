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
  // Exclude any folders named _legacy from Vite's server and build (see src/_legacy/AGENTS.md)
  server: {
    port: 3000,
    watch: {
      ignored: ['**/_legacy/**']
    }
  },
  build: {
    rollupOptions: {
      external: ['**/_legacy/**']
    }
  }
});
