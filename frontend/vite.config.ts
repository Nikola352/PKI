import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
      "@/api": "/src/api",
      "@/components": "/src/components",
      "@/context": "/src/context",
      "@/config": "/src/config",
      "@/hooks": "/src/hooks",
      "@/pages": "/src/pages",
      "@/layouts": "/src/layouts",
      "@/model": "/src/model",
    },
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "ssl", "localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "ssl", "localhost.pem")),
    },
  },
});
