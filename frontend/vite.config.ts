import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        changeOrigin: true,
        target: "https://urban-palm-tree-9pgwrx4qp57c7p67-3000.app.github.dev",
      },
    },
  },
  build: {
    outDir: "../server/frontend",
    emptyOutDir: true,
  },
});
