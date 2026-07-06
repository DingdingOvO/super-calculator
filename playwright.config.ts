import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: process.env.CI ? 'npm run build && npx http-server dist -p 3000 -s' : 'npm start',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
