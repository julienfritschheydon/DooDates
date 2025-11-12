/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2,
      },
    },
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    include: ["src/test/gemini-professional.test.ts"],
    exclude: ["node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["html", "json", "text"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
