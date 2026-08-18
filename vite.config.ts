import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      prerenderScript: path.resolve(process.cwd(), "src/prerender.ts"),
      renderTarget: "#root",
      additionalPrerenderRoutes: [
        "/overview",
        "/ministere",
        "/investitii",
        "/joc",
        "/en",
        "/en/overview",
        "/en/ministere",
        "/en/investitii",
        "/en/joc",
      ],
    }),
  ],
  server: {
    fs: {
      allow: [".."],
    },
  },
});
