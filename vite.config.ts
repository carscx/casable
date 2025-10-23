import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    https: {
      cert: fs.readFileSync("192.168.68.64+2.pem"),
      key: fs.readFileSync("192.168.68.64+2-key.pem")
    }
  }
});
