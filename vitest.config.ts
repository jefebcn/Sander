import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
    coverage: {
      include: ["src/lib/tournament/**"],
      thresholds: { lines: 90, functions: 90 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
