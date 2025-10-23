import react from "@vitejs/plugin-react";
import dns from "node:dns";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

dns.setDefaultResultOrder("verbatim");

if (!existsSync(path.join(__dirname, ".env"))) {
  copyFileSync(
    path.join(__dirname, ".env.defaults"),
    path.join(__dirname, ".env")
  );
}

dns.setDefaultResultOrder("verbatim");

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ["MEDPLUM_", "GOOGLE_", "HEALTH_CARD_"],
  plugins: [react()],
  server: {
    host: "localhost",
    port: 3000,
  },
});
