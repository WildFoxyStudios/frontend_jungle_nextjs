import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

/** Next `tsconfig` uses `jsx: "preserve"` — Vite/Vitest needs the React plugin to transform JSX in tests. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
