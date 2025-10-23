import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";

function expandHome(p?: string) {
  if (!p) return p;
  let s = p
    .trim()
    .replace(/^~\//, `${process.env.HOME}/`)
    .replace(/^\$HOME\//, `${process.env.HOME}/`);
  return s;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = mode === "development" && !!env.LOCAL_HTTPS;

  let https: any = false;
  if (useHttps && env.LOCAL_CERT && env.LOCAL_KEY) {
    const certPath = expandHome(env.LOCAL_CERT)!;
    const keyPath = expandHome(env.LOCAL_KEY)!;

    if (!fs.existsSync(certPath))
      console.error("❌ LOCAL_CERT no existe:", certPath);
    if (!fs.existsSync(keyPath))
      console.error("❌ LOCAL_KEY no existe:", keyPath);

    https = {
      cert: fs.readFileSync(path.resolve(certPath)),
      key: fs.readFileSync(path.resolve(keyPath))
    };
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
        },
        manifest: {
          name: "CasaBLE",
          short_name: "CasaBLE",
          description: "Controla tu casa con Bluetooth LE",
          theme_color: "#0b0f14",
          background_color: "#0b0f14",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    server: { host: "0.0.0.0", port: 5173, https }
  };
});
