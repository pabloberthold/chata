import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: "static",
  site: "https://pabloberthold.github.io",
  base: "/chata",
  build: {
    assets: "_assets",
  },
  vite: {
    ssr: {
      noExternal: ["katex", "marked", "dompurify", "highlight.js"],
    },
  },
});
