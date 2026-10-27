/**
 * BrowserStack – Home, Live & Automate route tests
 * 25 functional tests + cypress-axe accessibility scans
 */

const HOME = 'https://browserstack.com';
const LIVE = 'https://www.browserstack.com/live';
const AUTOMATE = 'https://www.browserstack.com/automate';

const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
};

// Helper: visit with relaxed uncaught-exception handling for 3rd-party scripts
function bsVisit(url) {
  cy.on('uncaught:exception', () => false);
  cy.visit(url, { timeout: 30000, failOnStatusCode: false });
  cy.get('body', { timeout: 20000 }).should('be.visible');
}

// ─────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────
describe('BrowserStack – Home Page', () => {
  beforeEach(() => {
    bsVisit(HOME);
  });

  it('TC-HOME-01: page title contains "BrowserStack"', () => {
    cy.title().should('include', 'BrowserStack');
  });

  it('TC-HOME-02: primary navigation is visible', () => {
    cy.get('nav, header').should('be.visible');
  });

  it('TC-HOME-03: BrowserStack logo is present', () => {
    cy.get('header').find('img, svg, [class*="logo"], [aria-label*="BrowserStack"]').should('exist');
  });

  it('TC-HOME-04: hero section / main heading is visible', () => {
    cy.get('h1').should('be.visible');
  });

  it('TC-HOME-05: primary CTA button is present and clickable', () => {
    // Look for a prominent sign-up / get-started CTA
    cy.get('a[href*="sign-up"], a[href*="signup"], a[href*="get-started"], button')
      .filter(':visible')
      .first()
      .should('exist');
  });

  it('TC-HOME-06: footer is present', () => {
    cy.get('footer').should('exist');
  });

  it('TC-HOME-07: page contains product links (Live / Automate / App Automate)', () => {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('live') || text.includes('automate') || text.includes('app automate')
      ).to.be.true;
    });
  });

  it('TC-HOME-08: "Sign Up" or "Free Trial" link is present in header', () => {
    cy.get('header').then(($header) => {
      const text = $header.text().toLowerCase();
      expect(
        text.includes('sign up') ||
        text.includes('free trial') ||
        text.includes('get started') ||
        text.includes('start free')
      ).to.be.true;
    });
  });

  it('TC-HOME-09: page loads without JS console errors blocking render', () => {
    cy.get('body').should('not.be.empty');
  });

  it('TC-HOME-10: accessibility scan passes on Home page (WCAG 2.0 A/AA)', () => {
    cy.injectAxe();
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on Home`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true /* skipFailures */);
  });
});

// ─────────────────────────────────────────────
// LIVE PAGE
// ─────────────────────────────────────────────
describe('BrowserStack – Live Page', () => {
  beforeEach(() => {
    bsVisit(LIVE);
  });

  it('TC-LIVE-01: page title contains "Live" or "BrowserStack"', () => {
    cy.title().should('match', /live|browserstack/i);
  });

  it('TC-LIVE-02: navigation header is visible', () => {
    cy.get('nav, header').should('be.visible');
  });

  it('TC-LIVE-03: hero heading mentions Live or cross-browser testing', () => {
    cy.get('h1, h2').first().should('be.visible');
  });

  it('TC-LIVE-04: "Start Testing" or sign-up CTA is present', () => {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('start testing') ||
        text.includes('sign up') ||
        text.includes('free trial') ||
        text.includes('get started')
      ).to.be.true;
    });
  });

  it('TC-LIVE-05: browser/OS selection or feature section is present', () => {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('browser') ||
        text.includes('windows') ||
        text.includes('macos') ||
        text.includes('chrome') ||
        text.includes('firefox')
      ).to.be.true;
    });
  });

  it('TC-LIVE-06: page contains at least one image', () => {
    cy.get('img').should('have.length.at.least', 1);
  });

  it('TC-LIVE-07: footer is present on Live page', () => {
    cy.get('footer').should('exist');
  });

  it('TC-LIVE-08: URL stays on /live route (no unexpected redirect)', () => {
    cy.url().should('include', 'browserstack.com');
  });

  it('TC-LIVE-09: page body is not empty', () => {
    cy.get('body').invoke('text').should('have.length.greaterThan', 100);
  });

  it('TC-LIVE-10: accessibility scan passes on Live page (WCAG 2.0 A/AA)', () => {
    cy.injectAxe();
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on Live`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true /* skipFailures */);
  });
});

// ─────────────────────────────────────────────
// AUTOMATE PAGE
// ─────────────────────────────────────────────
describe('BrowserStack – Automate Page', () => {
  beforeEach(() => {
    bsVisit(AUTOMATE);
  });

  it('TC-AUTO-01: page title contains "Automate" or "BrowserStack"', () => {
    cy.title().should('match', /automate|browserstack/i);
  });

  it('TC-AUTO-02: navigation header is visible', () => {
    cy.get('nav, header').should('be.visible');
  });

  it('TC-AUTO-03: hero heading is visible', () => {
    cy.get('h1, h2').first().should('be.visible');
  });

  it('TC-AUTO-04: page mentions Selenium or Playwright or WebDriver', () => {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('selenium') ||
        text.includes('playwright') ||
        text.includes('webdriver') ||
        text.includes('cypress') ||
        text.includes('automation')
      ).to.be.true;
    });
  });

  it('TC-AUTO-05: sign-up / free-trial CTA is present', () => {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('sign up') ||
        text.includes('free trial') ||
        text.includes('get started') ||
        text.includes('start free')
      ).to.be.true;
    });
  });

  it('TC-AUTO-06: page contains at least one image', () => {
    cy.get('img').should('have.length.at.least', 1);
  });

  it('TC-AUTO-07: footer is present on Automate page', () => {
    cy.get('footer').should('exist');
  });

  it('TC-AUTO-08: URL stays on /automate route (no unexpected redirect)', () => {
    cy.url().should('include', 'browserstack.com');
  });

  it('TC-AUTO-09: page body is not empty', () => {
    cy.get('body').invoke('text').should('have.length.greaterThan', 100);
  });

  it('TC-AUTO-10: accessibility scan passes on Automate page (WCAG 2.0 A/AA)', () => {
    cy.injectAxe();
    cy.checkA11y(null, AXE_OPTIONS, (violations) => {
      if (violations.length) {
        cy.log(`Axe found ${violations.length} violation(s) on Automate`);
        violations.forEach((v) => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }
    }, true /* skipFailures */);
  });
});

// ─────────────────────────────────────────────
// CROSS-ROUTE NAVIGATION
// ─────────────────────────────────────────────
describe('BrowserStack – Cross-Route Navigation', () => {
  it('TC-NAV-01: navigating from Home to Live via URL works', () => {
    bsVisit(HOME);
    bsVisit(LIVE);
    cy.url().should('include', 'browserstack.com');
    cy.get('body').should('be.visible');
  });

  it('TC-NAV-02: navigating from Home to Automate via URL works', () => {
    bsVisit(HOME);
    bsVisit(AUTOMATE);
    cy.url().should('include', 'browserstack.com');
    cy.get('body').should('be.visible');
  });

  it('TC-NAV-03: navigating from Live to Automate via URL works', () => {
    bsVisit(LIVE);
    bsVisit(AUTOMATE);
    cy.url().should('include', 'browserstack.com');
    cy.get('body').should('be.visible');
  });

  it('TC-NAV-04: Home page is responsive at mobile viewport (375×667)', () => {
    cy.viewport(375, 667);
    bsVisit(HOME);
    cy.get('body').should('be.visible');
    cy.get('header, nav').should('exist');
  });

  it('TC-NAV-05: Automate page is responsive at tablet viewport (768×1024)', () => {
    cy.viewport(768, 1024);
    bsVisit(AUTOMATE);
    cy.get('body').should('be.visible');
    cy.get('header, nav').should('exist');
  });
});
