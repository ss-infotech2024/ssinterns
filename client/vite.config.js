
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // frontend dev proxy → backend on Render
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // your backend
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Important for fixing MIME errors on production hosting
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },

  // Important when deploying to cPanel / Render static hosting
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});