import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: undefined as "react",
      bundler: "vite",
    },
    supportFile: false
  },
});
