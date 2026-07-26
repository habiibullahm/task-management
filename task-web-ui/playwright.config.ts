import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dedicated e2e ports so we never reuse a local `npm run dev` API (wrong CORS).
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:3001';
const UI_URL = process.env.PLAYWRIGHT_UI_URL || 'http://127.0.0.1:4173';
const API_PORT = new URL(API_URL).port || '3001';

// Same Node that launched Playwright (works in IDE without npm on PATH).
const nodeBin = process.execPath;
const apiDir = path.resolve(__dirname, '../task-api');
const apiTsc = path.join(apiDir, 'node_modules/typescript/bin/tsc');
const apiServer = path.join(apiDir, 'dist/server.js');
const viteBin = path.join(__dirname, 'node_modules/vite/bin/vite.js');

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/task_management_test?schema=public';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: UI_URL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: `"${nodeBin}" "${apiTsc}" -p tsconfig.build.json && "${nodeBin}" "${apiServer}"`,
      cwd: apiDir,
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: API_PORT,
        API_PREFIX: '/api/v1',
        CORS_ORIGIN: `${UI_URL},http://localhost:4173,http://127.0.0.1:4173`,
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long',
        JWT_REFRESH_SECRET:
          process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-chars',
        DATABASE_URL: testDbUrl,
        TEST_DATABASE_URL: testDbUrl,
      },
    },
    {
      command: `"${nodeBin}" "${viteBin}" build && "${nodeBin}" "${viteBin}" preview --host 127.0.0.1 --port 4173`,
      cwd: __dirname,
      url: UI_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: `${API_URL}/api/v1`,
      },
    },
  ],
});
