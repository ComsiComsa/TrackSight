import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [svelte(), crx({ manifest }), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        panel: "src/devtools/panel.html",
      },
    },
  },
});
