import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: { target: "esnext" },
  server: {
    fs: {
      allow: ["../../"],
    },
  },
  resolve: {
    alias: {
      "@reactively/core": resolve(__dirname, "../core/src/core"),
      "@reactively/decorate": resolve(__dirname, "../decorate/src/decorate"),
      "@reactively/lit": resolve(__dirname, "../lit/src/lit"),
      "@reactively/wrap": resolve(__dirname, "../wrap/src/wrap"),
    },
  },
});
