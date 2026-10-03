import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../website",
    emptyOutDir: false,
    chunkSizeWarningLimit: 1300,
  },
  server: { port: 5173 },
});
