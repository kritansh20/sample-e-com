const fs = require('fs');
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://gcc-habits-lone-edge.trycloudflare.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,

    env: {
      apiUrl: 'https://gcc-habits-lone-edge.trycloudflare.com/api',
      coverage: false,
      grepFilterSpecs: true,
      grepOmitFiltered: true,
      testUser: {
        email: 'john@example.com',
        password: 'Ecomm@123'
      }
    },

    retries: {
      runMode: 1,
      openMode: 0
    },

    supportFile: 'cypress/support/e2e.js',
    specPattern: ['cypress/e2e/**/*.cy.{js,ts}'],
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(`[${new Date().toISOString()}] ${message}`);
          return null;
        },
        readStorageState() {
          const statePath = process.env.STORAGE_STATE_PATH;
          if (!statePath || !fs.existsSync(statePath)) return null;
          return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        },
        generateTestReport() { return null; },
        cleanupTestData() { return null; },
        coverageReport() { return null; }
      });

      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
        }
        return launchOptions;
      });

      try {
        require('@cypress/grep/src/plugin')(config);
      } catch (e) {}

      return config;
    }
  }
});
