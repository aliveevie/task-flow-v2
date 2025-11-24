import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "taskflow.galaxyitt.com.ng",
      "api.galaxyitt.com.ng",
      "localhost",
      "127.0.0.1",
      "10.1.1.205",
    ],
  },
  preview: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "taskflow.galaxyitt.com.ng",
      "api.galaxyitt.com.ng",
      "localhost",
      "127.0.0.1",
      "10.1.1.205",
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Ensure .htaccess is copied to dist
    copyPublicDir: true,
  },
  publicDir: "public",
}));
