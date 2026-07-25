import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:3000';
const UI_URL = process.env.PLAYWRIGHT_UI_URL || 'http://127.0.0.1:4173';

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
      command: 'npm run start',
      cwd: '../task-api',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3000',
        API_PREFIX: '/api/v1',
        CORS_ORIGIN: UI_URL,
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long',
        JWT_REFRESH_SECRET:
          process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-chars',
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/task_management_test?schema=public',
      },
    },
    {
      command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
      cwd: '.',
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
