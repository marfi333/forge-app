import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/app/api/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
    },
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
