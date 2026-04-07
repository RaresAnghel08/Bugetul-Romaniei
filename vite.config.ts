import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const workspace = env.COUNTER_WORKSPACE || env.VITE_COUNTER_WORKSPACE || "rares-anghels-team-3633";
  const counterName = env.COUNTER_NAME || env.VITE_COUNTER_NAME || "mycountrar";
  const counterToken = env.COUNTER_API || env.VITE_COUNTER_API || "";
  const upstreamBasePath = `/v2/${workspace}/${counterName}`;

  return {
    plugins: [react()],
    server: {
      fs: {
        allow: [".."],
      },
      proxy: {
        "/api/counter": {
          target: "https://api.counterapi.dev",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/counter/, upstreamBasePath),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (counterToken) {
                proxyReq.setHeader("Authorization", `Bearer ${counterToken}`);
              }
              proxyReq.setHeader("Accept", "application/json");
            });
          },
        },
      },
    },
  };
});
