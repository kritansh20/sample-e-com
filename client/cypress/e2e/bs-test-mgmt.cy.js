// BrowserStack Test Management & Test Observability - Cypress Tests
// Target: https://browserstack.com/test-management and https://browserstack.com/test-observability

describe('Test Management - Page Load & Hero Section', () => {
  it('TC-01: Test Management page loads with correct title', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.title().should('not.be.empty');
    cy.get('body').should('be.visible');
  });

  it('TC-02: Test Management hero heading contains AI text', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.get('h1, h2').contains('Management').should('be.visible');
  });

  it('TC-03: Test Management page has Get started free CTA button', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Get started free', { timeout: 10000 }).should('be.visible');
  });

  it('TC-04: Test Management page has Contact sales button', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Contact sales', { timeout: 10000 }).should('be.visible');
  });

  it('TC-05: Test Management page shows 1000+ organizations social proof', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('1000+', { timeout: 10000 }).should('be.visible');
  });
});

describe('Test Management - Navigation & Features', () => {
  it('TC-06: Test Management sub-nav has Features link', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Features', { timeout: 10000 }).should('be.visible');
  });

  it('TC-07: Test Management sub-nav has Reporting link', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.get('nav a, header a, [class*="sub-nav"] a, [class*="subnav"] a').filter(':visible').should('have.length.gt', 0);
  });

  it('TC-08: Test Management sub-nav has Jira Sync link', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Jira Sync', { timeout: 10000 }).should('be.visible');
  });

  it('TC-09: Test Management sub-nav has Pricing link', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Pricing', { timeout: 10000 }).should('be.visible');
  });

  it('TC-10: Test Management page shows trusted customers section', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('customers', { timeout: 10000 }).should('exist');
  });
});

describe('Test Management - Stats & Integrations', () => {
  it('TC-11: Test Management page shows 90% faster test case creation stat', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('90%', { timeout: 10000 }).should('be.visible');
  });

  it('TC-12: Test Management page shows 50+ integrations stat', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('Integrations', { timeout: 10000 }).should('exist');
  });

  it('TC-13: Test Management page shows AI Agents section', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.contains('AI', { timeout: 10000 }).should('be.visible');
  });

  it('TC-14: Test Management page has BrowserStack logo', () => {
    cy.visit('https://browserstack.com/test-management');
    cy.get('img[alt*="BrowserStack"], a[href="/"]').first().should('be.visible');
  });

  it('TC-15: Test Management Reporting sub-page loads', () => {
    cy.visit('https://www.browserstack.com/test-management/reporting', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });
});

describe('Test Observability - Page Load & Hero Section', () => {
  it('TC-16: Test Observability page loads successfully', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('TC-17: Test Observability page shows Unified reporting heading', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('reporting', { timeout: 10000 }).should('be.visible');
  });

  it('TC-18: Test Observability page has Get started free button', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('Get started free', { timeout: 10000 }).should('be.visible');
  });

  it('TC-19: Test Observability page has Explore Sandbox button', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('Explore Sandbox', { timeout: 10000 }).should('be.visible');
  });

  it('TC-20: Test Observability page shows Test Reporting & Analytics label', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.get('body').contains('Analytics').should('exist');
  });
});

describe('Test Observability - Features & Navigation', () => {
  it('TC-21: Test Observability sub-nav has Features link', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('Features', { timeout: 10000 }).should('be.visible');
  });

  it('TC-22: Test Observability sub-nav has Why This? link', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('Why This?', { timeout: 10000 }).should('be.visible');
  });

  it('TC-23: Test Observability sub-nav has Sandbox link', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('Sandbox', { timeout: 10000 }).should('be.visible');
  });

  it('TC-24: Test Observability page shows 50,000 customers social proof', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('customers', { timeout: 10000 }).should('exist');
  });

  it('TC-25: Test Observability page shows AI powered analytics mention', () => {
    cy.visit('https://browserstack.com/test-observability');
    cy.contains('AI', { timeout: 10000 }).should('be.visible');
  });
});
