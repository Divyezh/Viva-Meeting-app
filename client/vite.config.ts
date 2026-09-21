import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@clerk")) return "clerk";
            if (id.includes("react-router") || id.includes("react-dom") || id.includes("react/")) return "vendor";
            if (id.includes("lucide-react") || id.includes("react-hot-toast")) return "ui";
            if (id.includes("howler")) return "audio";
          }
        },
      },
    },
  },
});
