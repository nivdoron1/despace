import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, createLogger } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const logger = createLogger();
const originalError = logger.error;
const originalWarn = logger.warn;

logger.error = (msg, options) => {
  if (msg.includes("Error when using sourcemap") || msg.includes("Can't resolve original location")) return;
  originalError(msg, options);
};

logger.warn = (msg, options) => {
  if (msg.includes("Error when using sourcemap") || msg.includes("Can't resolve original location")) return;
  originalWarn(msg, options);
};

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  customLogger: logger,
  logLevel: "info",
  build: {
    sourcemap: false,
  },
  css: {
    devSourcemap: false,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
