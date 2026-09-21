import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://viva-meeting-app.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@clerk")) return "clerk";
            if (id.includes("react-router") || id.includes("react-dom") || id.includes("react/")) return "vendor";
            if (id.includes("lucide-react") || id.includes("react-hot-toast")) return "ui";
            if (id.includes("howler")) return "audio";
            if (id.includes("socket.io-client")) return "socket";
          }
        },
      },
    },
  },
});
