import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  envDir: "..",
  build: {
    outDir: "../website",
    emptyOutDir: false,
    chunkSizeWarningLimit: 1300,
    rollupOptions: { input: { index: "index.html", network: "network.html" } },
  },
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8001" } },
});
