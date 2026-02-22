import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["apps/web/src/**/*.test.tsx", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts", "apps/**/src/**/*.test.tsx"]
  }
});
