import { defineConfig, devices } from "@playwright/test";

// End-to-end tests in a real browser, against a production build on a throwaway database.
// A production build, not `next dev`: Next allows one dev server per folder, and it's what ships.
const PORT = 3210;

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts", // not *.test.ts, which Vitest runs
  workers: 1, // one database for every test
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `rm -rf e2e/.data && next build && next start --port ${PORT}`,
    env: { DATABASE_PATH: "e2e/.data/test.db" },
    url: `http://localhost:${PORT}/people`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
