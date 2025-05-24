import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'off',
    screenshot: 'off',
    bypassCSP: true,
    javaScriptEnabled: true,
    hasTouch: false,
    isMobile: false,
    locale: 'en-US',
    timezoneId: 'UTC',
    deviceScaleFactor: 1
  },
  timeout: 30000,
  workers: 1,
  retries: 0,
  reporter: 'null',
  preserveOutput: 'failures-only'
};

export default config; 