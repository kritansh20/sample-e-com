// Auth helper: restore saved session when STORAGE_STATE_PATH is set and file exists,
// otherwise log in with credentials from env.
const fs = require('fs');

/**
 * Call this in a beforeEach or before() to ensure the user is logged in.
 * Usage in a spec: before(() => cy.loginOrRestoreSession());
 */
Cypress.Commands.add('loginOrRestoreSession', (
  email = Cypress.env('testUser')?.email || 'john@example.com',
  password = Cypress.env('testUser')?.password || 'Ecomm@123'
) => {
  const storagePath = Cypress.env('STORAGE_STATE_PATH') || process.env.STORAGE_STATE_PATH;

  if (storagePath && fs.existsSync(storagePath)) {
    // Restore cookies from the saved session
    cy.log('Restoring saved auth session from ' + storagePath);
    const session = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    if (session.cookies && session.cookies.length > 0) {
      session.cookies.forEach(cookie => {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain ? cookie.domain.replace(/^\./, '') : undefined,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expiry: cookie.expires > 0 ? cookie.expires : undefined,
        });
      });
    }
    if (session.origins) {
      session.origins.forEach(origin => {
        if (origin.localStorage) {
          cy.window().then(win => {
            origin.localStorage.forEach(({ name, value }) => {
              win.localStorage.setItem(name, value);
            });
          });
        }
      });
    }
  } else {
    // Fall back to UI login
    cy.log('No saved session found, logging in via UI');
    cy.visit('/login');
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  }
});
