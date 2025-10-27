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
        includeAssets: ["**/*.{png,svg,jpg}"],
        manifest: {
          name: "Proyecto Kairos",
          short_name: "Kairos",
          description: "Proyecto Kairos: Domótica Consciente",
          theme_color: "#0b0f14",
          background_color: "#0b0f14",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "icons/favicon-96x96.png",
              sizes: "96x96",
              type: "image/png"
            },
            {
              src: "icons/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icons/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any" // 'any' es bueno para el icono principal
            }
          ]
        }
      })
    ],
    server: { host: "0.0.0.0", port: 5173, https }
  };
});
