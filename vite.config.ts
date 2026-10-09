import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  define: { __BUILT_AT__: JSON.stringify(new Date().toISOString().replace(/\.\d{3}Z$/, "Z")) },
});
