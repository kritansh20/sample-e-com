/**
 * Auth session helper — Cypress browser-side commands.
 * Imported by cypress/support/e2e.js (runs in the browser context).
 */

const TEST_USER_EMAIL = 'john@example.com';
const TEST_USER_PASSWORD = 'Ecomm@123';

/**
 * cy.ensureLoggedIn() — restore saved session or fall back to UI login.
 */
Cypress.Commands.add('ensureLoggedIn', (email = TEST_USER_EMAIL, password = TEST_USER_PASSWORD) => {
  cy.task('readStorageState').then((state) => {
    if (state && state.cookies && state.cookies.length > 0) {
      state.cookies.forEach((cookie) => {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain ? cookie.domain.replace(/^\./, '') : 'localhost',
          path: cookie.path || '/',
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
        });
      });
      if (state.origins) {
        state.origins.forEach((origin) => {
          if (origin.localStorage) {
            cy.window().then((win) => {
              origin.localStorage.forEach(({ name, value }) => {
                win.localStorage.setItem(name, value);
              });
            });
          }
        });
      }
      cy.log('✅ Auth session restored from saved state');
    } else {
      cy.visit('/login');
      cy.get('#email').clear().type(email);
      cy.get('#password').clear().type(password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('not.include', '/login');
      cy.get('header', { timeout: 10000 }).should('contain', 'Hi,');
      cy.log('✅ Logged in via UI');
    }
  });
});
