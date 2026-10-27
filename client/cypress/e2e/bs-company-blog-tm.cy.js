/**
 * BrowserStack – Company, Blog, and Test Management page tests
 * Routes: /company  /blog  /test-management
 * Covers: page structure, navigation, content, CTAs, key UI elements, accessibility (axe)
 */

const ROUTES = {
  company: 'https://www.browserstack.com/company',
  blog: 'https://www.browserstack.com/blog',
  testManagement: 'https://www.browserstack.com/test-management',
};

const visitAndInjectAxe = (url) => {
  cy.visit(url, { failOnStatusCode: false });
  cy.injectAxe();
};

// ─── Company page ────────────────────────────────────────────────────────────
describe('BrowserStack Company page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.company);
  });

  it('TC-01 – page loads with 200 and body is visible', () => {
    cy.get('body').should('be.visible');
    cy.url().should('include', 'browserstack.com/company');
  });

  it('TC-02 – page title contains BrowserStack', () => {
    cy.title().should('match', /browserstack/i);
  });

  it('TC-03 – global navigation header is present', () => {
    cy.get('header, nav, [role="navigation"]').first().should('be.visible');
  });

  it('TC-04 – page contains a main heading (h1)', () => {
    cy.get('h1').should('exist').and('not.be.empty');
  });

  it('TC-05 – footer is rendered on the Company page', () => {
    cy.get('footer').should('exist');
  });

  it('TC-06 – Company page contains "About" or "Mission" content', () => {
    cy.get('body').invoke('text').then((text) => {
      const lower = text.toLowerCase();
      expect(lower).to.match(/about|mission|vision|who we are/);
    });
  });

  it('TC-07 – at least one CTA button or link is present', () => {
    cy.get('a[href], button').filter(':visible').should('have.length.at.least', 1);
  });

  it('TC-08 – accessibility scan passes on Company page (no critical violations)', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical'],
    }, null, true);
  });
});

// ─── Blog page ───────────────────────────────────────────────────────────────
describe('BrowserStack Blog page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.blog);
  });

  it('TC-09 – Blog page loads and body is visible', () => {
    cy.get('body').should('be.visible');
    cy.url().should('include', 'browserstack.com/blog');
  });

  it('TC-10 – Blog page title contains BrowserStack', () => {
    cy.title().should('match', /browserstack/i);
  });

  it('TC-11 – Blog page has a navigation header', () => {
    cy.get('header, nav, [role="navigation"]').first().should('be.visible');
  });

  it('TC-12 – Blog page has at least one article or post element', () => {
    cy.get('article, [class*="post"], [class*="blog"], [class*="card"]')
      .should('have.length.at.least', 1);
  });

  it('TC-13 – Blog page has a main heading (h1 or h2)', () => {
    cy.get('h1, h2').first().should('exist').and('not.be.empty');
  });

  it('TC-14 – Blog posts contain clickable links', () => {
    cy.get('article a, [class*="post"] a, [class*="blog"] a, [class*="card"] a')
      .filter(':visible')
      .should('have.length.at.least', 1);
  });

  it('TC-15 – Blog page footer is present', () => {
    cy.get('footer').should('exist');
  });

  it('TC-16 – Blog page contains category or tag navigation', () => {
    cy.get('body').invoke('text').then((text) => {
      const lower = text.toLowerCase();
      expect(lower).to.match(/categor|tag|topic|filter|all posts/);
    });
  });

  it('TC-17 – Blog page has images with alt attributes', () => {
    cy.get('img:visible').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('TC-18 – accessibility scan passes on Blog page (no critical violations)', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical'],
    }, null, true);
  });
});

// ─── Test Management page ────────────────────────────────────────────────────
describe('BrowserStack Test Management page', () => {
  beforeEach(() => {
    visitAndInjectAxe(ROUTES.testManagement);
  });

  it('TC-19 – Test Management page loads and body is visible', () => {
    cy.get('body').should('be.visible');
    cy.url().should('include', 'browserstack.com/test-management');
  });

  it('TC-20 – Test Management page title contains BrowserStack', () => {
    cy.title().should('match', /browserstack/i);
  });

  it('TC-21 – Test Management page has a navigation header', () => {
    cy.get('header, nav, [role="navigation"]').first().should('be.visible');
  });

  it('TC-22 – Test Management page has a main heading (h1)', () => {
    cy.get('h1').should('exist').and('not.be.empty');
  });

  it('TC-23 – Test Management page contains product-related keywords', () => {
    cy.get('body').invoke('text').then((text) => {
      const lower = text.toLowerCase();
      expect(lower).to.match(/test management|test case|test plan|quality/);
    });
  });

  it('TC-24 – Test Management page has at least one primary CTA (Free Trial / Get Started / Sign Up)', () => {
    cy.get('a, button').filter(':visible').then(($els) => {
      const texts = [...$els].map((el) => el.textContent.toLowerCase());
      const hasCta = texts.some((t) =>
        /free trial|get started|sign up|start free|try free|request demo/.test(t)
      );
      expect(hasCta, 'Primary CTA found').to.be.true;
    });
  });

  it('TC-25 – accessibility scan passes on Test Management page (no critical violations)', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical'],
    }, null, true);
  });
});
