/**
 * Auth tasks — Node.js side only (runs in cypress.config.js setupNodeEvents).
 * Reads the saved Playwright storage state so Cypress can restore the session.
 */
const fs = require('fs');

function registerAuthTasks(on) {
  on('task', {
    readStorageState() {
      const path = process.env.STORAGE_STATE_PATH;
      if (path && fs.existsSync(path)) {
        try {
          return JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch {
          return null;
        }
      }
      return null;
    },
  });
}

module.exports = { registerAuthTasks };
