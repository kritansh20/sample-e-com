// BrowserStack Percy & Accessibility Testing - 25 Cypress Test Cases

describe('Percy Product Page', () => {
  it('TC01 - Percy page hero heading contains "Visual Testing"', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Visual Testing').should('be.visible');
  });

  it('TC02 - Percy page title includes Percy', () => {
    cy.visit('https://browserstack.com/percy');
    cy.title().should('include', 'Percy');
  });

  it('TC03 - Percy page has "Get started free" CTA button', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Get started free').should('be.visible');
  });

  it('TC04 - Percy page has "Get a Demo" CTA button', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Get a Demo').should('be.visible');
  });

  it('TC05 - Percy page shows "50,000 customers" trust section', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('50,000').should('exist');
  });

  it('TC06 - Percy page shows "528M+" screenshots compared stat', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('528M+').should('be.visible');
  });

  it('TC07 - Percy page shows "2.4M+" visual bugs caught stat', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('2.4M+').should('be.visible');
  });

  it('TC08 - Percy page shows "Review and Approve Visual Regressions" section', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Review and Approve Visual Regressions').should('be.visible');
  });

  it('TC09 - Percy page mentions Storybook integration', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Storybook').should('exist');
  });

  it('TC10 - Percy page mentions Playwright integration', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Playwright').should('be.visible');
  });

  it('TC11 - Percy page mentions Selenium integration', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Selenium').should('be.visible');
  });

  it('TC12 - Percy page shows "50+ integrations" text', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('50+').should('exist');
  });

  it('TC13 - Percy page has Features nav link', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Features').should('be.visible');
  });

  it('TC14 - Percy page has Pricing nav link', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Pricing').should('be.visible');
  });

  it('TC15 - Percy page has Documentation nav link', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Documentation').should('exist');
  });

  it('TC16 - Percy page has Visual Testing nav menu', () => {
    cy.visit('https://browserstack.com/percy');
    cy.contains('Visual Testing').should('be.visible');
  });

  it('TC17 - Percy page has BrowserStack logo', () => {
    cy.visit('https://browserstack.com/percy');
    cy.get('img[alt*="BrowserStack"], a[href="/"]').should('exist');
  });

  it('TC18 - Percy page URL is correct', () => {
    cy.visit('https://browserstack.com/percy');
    cy.url().should('include', 'percy');
  });
});

describe('Accessibility Testing Product Page', () => {
  it('TC19 - Accessibility Testing page hero heading visible', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.get('h1, h2').contains(/accessibility/i).should('exist');
  });

  it('TC20 - Accessibility Testing page title includes Accessibility', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.title().should('match', /[Aa]ccessibility/);
  });

  it('TC21 - Accessibility Testing page mentions WCAG compliance', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.contains('WCAG').should('exist');
  });

  it('TC22 - Accessibility Testing page mentions EAA and ADA standards', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.contains('EAA').should('exist');
  });

  it('TC23 - Accessibility Testing page has "Get started free" CTA', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.contains('Get started free').should('be.visible');
  });

  it('TC24 - Accessibility Testing page has Spectra nav item', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.contains('Spectra').should('exist');
  });

  it('TC25 - Accessibility Testing page mentions CI/CD integration', () => {
    cy.visit('https://browserstack.com/accessibility-testing');
    cy.contains('CI/CD').should('exist');
  });
});
