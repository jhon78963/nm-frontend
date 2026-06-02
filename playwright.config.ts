import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '4200';
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

// ng serve keeps HMR open and page.goto(..., load) never completes in CI.
const webServerCommand = process.env.CI
  ? `npx ng build --configuration local && npx --yes http-server dist/nmaritex-app/browser -p ${PORT} -c-1 --spa`
  : `npm run start -- --port ${PORT}`;

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: process.env.CI ? 60_000 : 30_000,
  },
  // Credenciales alineadas con SEEDER_DEFAULT_PASSWORD del backend
  env: {
    E2E_USERNAME: process.env.E2E_USERNAME ?? 'vendedora',
    E2E_PASSWORD: process.env.E2E_PASSWORD ?? 'password123',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 240_000 : 120_000,
  },
});
