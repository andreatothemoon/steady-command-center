import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const BASE_URL = process.env.REGRESSION_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  globalSetup: path.resolve(__dirname, "./globalSetup.ts"),
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 900 },
    // Storage state produced by globalSetup; every test starts signed in.
    storageState: path.resolve(__dirname, ".auth/regression.json"),
  },
  projects: [
    {
      name: "smoke",
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "journeys",
      testMatch: /journeys\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
