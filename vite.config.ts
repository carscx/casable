import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
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
  const env = loadEnv(mode, process.cwd(), ""); // carga también LOCAL_*
  const useHttps = mode === "development" && !!env.LOCAL_HTTPS;

  let https: any = false;
  if (useHttps && env.LOCAL_CERT && env.LOCAL_KEY) {
    const certPath = expandHome(env.LOCAL_CERT)!;
    const keyPath = expandHome(env.LOCAL_KEY)!;

    // Mensajes útiles si hay typo:
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
    plugins: [react()],
    server: { host: "0.0.0.0", port: 5173, https }
  };
});
