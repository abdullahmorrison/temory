import { defineConfig, devices } from "@playwright/test";
import { DATABASE_PATH } from "./e2e/helpers";

// End-to-end tests in a real browser, against a production build on a throwaway database.
// A production build, not `next dev`: Next allows one dev server per folder, and it's what ships.
const PORT = 3210;

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts", // not *.test.ts, which Vitest runs
  workers: 1, // one database, cleared before each test
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Every flow runs once, on desktop. Phones also run the ones whose screens or history differ by width.
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: ["history.e2e.ts", "places.e2e.ts"] },
  ],
  webServer: {
    command: `next build && next start --port ${PORT}`,
    env: { DATABASE_PATH }, // cleared before each test (e2e/helpers.ts)
    url: `http://localhost:${PORT}/people`,
    timeout: 300_000,
  },
});
