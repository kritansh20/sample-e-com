// BrowserStack Automate Product Page & Docs Section Tests
// Target: https://browserstack.com/automate and https://browserstack.com/docs

describe('BrowserStack Automate Product Page', () => {
  it('TC-01: Automate page loads with correct title', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.title().should('include', 'Automate');
  });

  it('TC-02: Hero heading contains browser test automation text', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.get('h1').should('be.visible');
    cy.get('h1').invoke('text').should('match', /browser|automat|test/i);
  });

  it('TC-03: Get Started Free CTA button is visible on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains('a', /get started free/i).should('be.visible');
  });

  it('TC-04: Get a Demo CTA button is visible on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/get a demo/i).first().should('exist');
  });

  it('TC-05: Trusted by 50,000 customers section is visible', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/trusted by more than 50,000/i).should('be.visible');
  });

  it('TC-06: Why Choose Automate section is present', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/why choose automate/i).should('be.visible');
  });

  it('TC-07: Scale functional testing section is visible', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/scale functional testing/i).should('be.visible');
  });

  it('TC-08: CI/CD pipelines section is visible', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/ci\/cd/i).should('exist');
  });

  it('TC-09: Automate page top nav has Features link', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains('nav', /features/i).should('exist');
  });

  it('TC-10: Automate page top nav has Pricing link', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/pricing/i).should('be.visible');
  });

  it('TC-11: Selenium framework is mentioned on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/selenium/i).should('exist');
  });

  it('TC-12: Playwright framework is mentioned on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/playwright/i).should('exist');
  });

  it('TC-13: Cypress framework is mentioned on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/cypress/i).should('exist');
  });

  it('TC-14: Load Testing nav link is present on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/load testing/i).should('exist');
  });

  it('TC-15: AI Agents nav link is present on Automate page', () => {
    cy.visit('https://www.browserstack.com/automate');
    cy.contains(/ai agents/i).should('exist');
  });
});

describe('BrowserStack Docs Homepage', () => {
  it('TC-16: Docs page loads with Documentation heading', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains('h1', /documentation/i).should('be.visible');
  });

  it('TC-17: Docs page has a search input field', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.get('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').should('be.visible');
  });

  it('TC-18: Docs page shows Popular Searches section', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains(/popular searches/i).should('be.visible');
  });

  it('TC-19: Docs page shows Local Testing popular search link', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains('a', /local testing/i).should('be.visible');
  });

  it('TC-20: Docs page shows Selenium testing popular search link', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains('a', /selenium testing/i).should('be.visible');
  });

  it('TC-21: Docs page shows Featured Products section', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains(/featured products/i).should('be.visible');
  });

  it('TC-22: Docs page shows Automate product card', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains(/automate/i).should('exist');
  });

  it('TC-23: Automate docs card shows Selenium tag', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains('a', /selenium/i).should('be.visible');
  });

  it('TC-24: Automate docs card shows Playwright tag', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains(/playwright/i).should('exist');
  });

  it('TC-25: Docs page Join our Discord link is visible', () => {
    cy.visit('https://www.browserstack.com/docs');
    cy.contains(/join our discord/i).should('be.visible');
  });
});
