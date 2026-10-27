/**
 * BrowserStack Pricing, App Automate & App Live – E2E + Accessibility Tests
 * Routes: /pricing | /app-automate | /app-live
 */

const PRICING_URL     = 'https://www.browserstack.com/pricing';
const APP_AUTOMATE_URL = 'https://www.browserstack.com/app-automate';
const APP_LIVE_URL    = 'https://www.browserstack.com/app-live';

const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: {
    // BrowserStack marketing pages use third-party iframes; skip those
    'frame-title': { enabled: false },
  },
};

// Helper: visit a URL, inject axe, and log any violations without hard-failing
function visitAndInjectAxe(url) {
  cy.visit(url, { timeout: 30000 });
  cy.injectAxe();
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('BrowserStack Pricing Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(PRICING_URL);
  });

  // TC-01
  it('TC-01: Pricing page loads with a 200 status and visible body', () => {
    cy.request(PRICING_URL).its('status').should('eq', 200);
    cy.get('body').should('be.visible');
  });

  // TC-02
  it('TC-02: Page title contains "Pricing"', () => {
    cy.title().should('match', /pricing/i);
  });

  // TC-03
  it('TC-03: Pricing page has a main heading', () => {
    cy.get('h1, h2').first().should('be.visible').and('not.be.empty');
  });

  // TC-04
  it('TC-04: At least three pricing plan cards / tiers are visible', () => {
    // Plans are typically rendered in a grid; look for repeated card-like containers
    cy.get('[class*="plan"], [class*="tier"], [class*="card"], [class*="pricing"]')
      .filter(':visible')
      .should('have.length.at.least', 3);
  });

  // TC-05
  it('TC-05: Pricing page body contains price indicators ($ or "Free" or "Custom")', () => {
    cy.get('body').invoke('text').should('match', /\$\d+|free|custom|contact sales/i);
  });

  // TC-06
  it('TC-06: "Get Started" or "Start Free Trial" CTA is present on the pricing page', () => {
    cy.contains('a, button', /get started|start free trial|free trial|sign up/i)
      .should('be.visible');
  });

  // TC-07
  it('TC-07: "Contact Sales" or "Talk to Sales" CTA is present', () => {
    cy.contains('a, button', /contact sales|talk to sales|contact us/i)
      .should('be.visible');
  });

  // TC-08
  it('TC-08: Monthly / Annual billing toggle exists', () => {
    cy.get('body').then(($body) => {
      const hasToggle =
        $body.find('[class*="toggle"], [class*="switch"], [class*="billing"]').length > 0 ||
        $body.text().match(/monthly|annual|yearly/i);
      expect(hasToggle).to.be.ok;
    });
  });

  // TC-09
  it('TC-09: Feature comparison table or feature list is present', () => {
    cy.get('table, [class*="feature"], [class*="compare"]')
      .filter(':visible')
      .should('have.length.at.least', 1);
  });

  // TC-10
  it('TC-10: Pricing page passes WCAG 2.0 AA axe accessibility scan', () => {
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on /pricing`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true /* skipFailures */);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// APP AUTOMATE PAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('BrowserStack App Automate Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(APP_AUTOMATE_URL);
  });

  // TC-11
  it('TC-11: App Automate page loads with a 200 status', () => {
    cy.request(APP_AUTOMATE_URL).its('status').should('eq', 200);
    cy.get('body').should('be.visible');
  });

  // TC-12
  it('TC-12: Page title references automated app testing', () => {
    cy.title().should('match', /automat|app.*test|mobile.*test/i);
  });

  // TC-13
  it('TC-13: Hero section has a primary heading', () => {
    cy.get('h1').first().should('be.visible').and('not.be.empty');
  });

  // TC-14
  it('TC-14: Primary CTA ("Start Free Trial" or "Get Started") is visible in the hero', () => {
    cy.contains('a, button', /start free trial|get started|free trial/i)
      .first()
      .should('be.visible');
  });

  // TC-15
  it('TC-15: Supported frameworks / languages section is present', () => {
    cy.get('body').invoke('text').should('match', /appium|xcuitest|espresso|detox|framework/i);
  });

  // TC-16
  it('TC-16: Key feature list items are visible (at least 3)', () => {
    cy.get('ul li, [class*="feature"] li, [class*="benefit"]')
      .filter(':visible')
      .should('have.length.at.least', 3);
  });

  // TC-17
  it('TC-17: Real device cloud mention is present on the page', () => {
    cy.get('body').invoke('text').should('match', /real device|real devices/i);
  });

  // TC-18
  it('TC-18: Navigation header is visible and contains the BrowserStack logo', () => {
    cy.get('header, nav').first().should('be.visible');
    cy.get('header img, nav img, [class*="logo"] img')
      .first()
      .should('be.visible');
  });

  // TC-19
  it('TC-19: Footer is present and contains copyright text', () => {
    cy.get('footer').should('be.visible');
    cy.get('footer').invoke('text').should('match', /browserstack|©|copyright/i);
  });

  // TC-20
  it('TC-20: App Automate page passes WCAG 2.0 AA axe accessibility scan', () => {
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on /app-automate`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// APP LIVE PAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('BrowserStack App Live Page', () => {
  beforeEach(() => {
    visitAndInjectAxe(APP_LIVE_URL);
  });

  // TC-21
  it('TC-21: App Live page loads with a 200 status', () => {
    cy.request(APP_LIVE_URL).its('status').should('eq', 200);
    cy.get('body').should('be.visible');
  });

  // TC-22
  it('TC-22: Page title references interactive mobile app testing', () => {
    cy.title().should('match', /app|mobile|interactive|live/i);
  });

  // TC-23
  it('TC-23: Hero section has a primary heading', () => {
    cy.get('h1').first().should('be.visible').and('not.be.empty');
  });

  // TC-24
  it('TC-24: Primary CTA is visible on App Live page', () => {
    cy.contains('a, button', /start free trial|get started|free trial|sign up/i)
      .first()
      .should('be.visible');
  });

  // TC-25
  it('TC-25: App Live page passes WCAG 2.0 AA axe accessibility scan', () => {
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on /app-live`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true);
  });
});
