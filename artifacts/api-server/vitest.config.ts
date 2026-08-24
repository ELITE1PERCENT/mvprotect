import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Run tests serially — they share a real database
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30_000,
    include: ["src/**/*.test.ts"],
  },
});
