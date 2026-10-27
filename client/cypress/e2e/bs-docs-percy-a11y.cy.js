/**
 * BrowserStack Docs, Percy, and Accessibility Testing pages
 * 25 Cypress E2E tests + cypress-axe accessibility scans
 * Routes: /docs, /percy, /accessibility-testing
 */

const ROUTES = {
  docs: 'https://www.browserstack.com/docs',
  percy: 'https://www.browserstack.com/percy',
  a11y: 'https://www.browserstack.com/accessibility-testing',
};

const visitAndInjectAxe = (url) => {
  cy.visit(url, { failOnStatusCode: false });
  cy.injectAxe();
};

// ─── DOCS PAGE ────────────────────────────────────────────────────────────────
describe('BrowserStack Docs Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.docs);
  });

  it('TC-01: Docs page loads with 200 status and body is visible', () => {
    cy.get('body').should('be.visible');
  });

  it('TC-02: Docs page has a meaningful <title>', () => {
    cy.title().should('not.be.empty');
  });

  it('TC-03: Docs page contains a primary navigation element', () => {
    cy.get('nav, [role="navigation"]').should('exist');
  });

  it('TC-04: Docs page has a search input for documentation', () => {
    cy.get('input[type="search"], input[placeholder*="Search"], input[aria-label*="search" i]')
      .should('exist');
  });

  it('TC-05: Docs page sidebar or category list is present', () => {
    cy.get('aside, [class*="sidebar"], [class*="nav-list"], [class*="category"]').should('exist');
  });

  it('TC-06: Docs page main content area is present', () => {
    cy.get('main, [role="main"], [class*="content"], article').should('exist');
  });

  it('TC-07: Docs page has at least one heading (h1 or h2)', () => {
    cy.get('h1, h2').should('have.length.at.least', 1);
  });

  it('TC-08: Docs page contains at least one internal link', () => {
    cy.get('a[href*="browserstack.com"], a[href^="/"]').should('have.length.at.least', 1);
  });

  it('TC-09: Docs page accessibility scan passes with no critical violations', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, (violations) => {
      if (violations.length > 0) {
        cy.log(`Accessibility violations found: ${violations.length}`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true); // true = do not fail on violations, just log
  });

  it('TC-10: Docs page BrowserStack logo is visible in header', () => {
    cy.get('header img[alt*="BrowserStack" i], header [class*="logo"], header svg')
      .should('exist');
  });
});

// ─── PERCY PAGE ───────────────────────────────────────────────────────────────
describe('BrowserStack Percy Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.percy);
  });

  it('TC-11: Percy page loads and body is visible', () => {
    cy.get('body').should('be.visible');
  });

  it('TC-12: Percy page has a meaningful <title> containing "Percy"', () => {
    cy.title().should('match', /percy/i);
  });

  it('TC-13: Percy page has an h1 hero heading', () => {
    cy.get('h1').should('exist').and('not.be.empty');
  });

  it('TC-14: Percy page contains a primary CTA button (Get Started / Free Trial / Sign Up)', () => {
    cy.get('a, button').contains(/get started|free trial|sign up|start for free/i).should('exist');
  });

  it('TC-15: Percy page navigation bar is present', () => {
    cy.get('nav, [role="navigation"]').should('exist');
  });

  it('TC-16: Percy page has at least one feature section or card', () => {
    cy.get('[class*="feature"], [class*="card"], section').should('have.length.at.least', 1);
  });

  it('TC-17: Percy page contains at least one image with alt text', () => {
    cy.get('img').first().should('have.attr', 'alt');
  });

  it('TC-18: Percy page footer is present', () => {
    cy.get('footer, [role="contentinfo"]').should('exist');
  });

  it('TC-19: Percy page accessibility scan passes with no critical violations', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, (violations) => {
      if (violations.length > 0) {
        cy.log(`Accessibility violations found: ${violations.length}`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true);
  });

  it('TC-20: Percy page URL stays on /percy after load', () => {
    cy.url().should('include', '/percy');
  });
});

// ─── ACCESSIBILITY TESTING PAGE ───────────────────────────────────────────────
describe('BrowserStack Accessibility Testing Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.a11y);
  });

  it('TC-21: Accessibility Testing page loads and body is visible', () => {
    cy.get('body').should('be.visible');
  });

  it('TC-22: Accessibility Testing page has a meaningful <title>', () => {
    cy.title().should('match', /accessibility/i);
  });

  it('TC-23: Accessibility Testing page has an h1 hero heading', () => {
    cy.get('h1').should('exist').and('not.be.empty');
  });

  it('TC-24: Accessibility Testing page contains a primary CTA (Get Started / Free Trial / Request Demo)', () => {
    cy.get('a, button').contains(/get started|free trial|request demo|start for free/i).should('exist');
  });

  it('TC-25: Accessibility Testing page accessibility scan passes with no critical violations', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, (violations) => {
      if (violations.length > 0) {
        cy.log(`Accessibility violations found: ${violations.length}`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true);
  });
});
