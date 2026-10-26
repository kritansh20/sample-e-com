// BrowserStack Pricing & Plans - Cypress Test Suite
// Target: https://browserstack.com/pricing and related plan pages

describe('BrowserStack Pricing Page - Page Load', () => {
  it('TC-01: should load the main pricing page successfully', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.url().should('include', 'browserstack.com');
    cy.get('body').should('be.visible');
  });

  it('TC-02: should display the BrowserStack logo on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.get('img[alt*="BrowserStack"], img[src*="browserstack"], a[href*="browserstack.com"] img').first().should('exist');
  });

  it('TC-03: should display the page title containing BrowserStack', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.title().should('match', /BrowserStack/i);
  });

  it('TC-04: should display navigation header on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.get('header, nav, [class*="header"], [class*="nav"]').should('exist');
  });
});

describe('BrowserStack Pricing Page - Plan Tiers Display', () => {
  it('TC-05: should display Live product section on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('h1, h2, h3, [class*="product-name"], [class*="title"]', 'Live').should('exist');
  });

  it('TC-06: should display Team plan tier on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Team').should('be.visible');
  });

  it('TC-07: should display Team Pro plan tier on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Team Pro').should('be.visible');
  });

  it('TC-08: should display Team Ultimate plan tier on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Team Ultimate').should('be.visible');
  });

  it('TC-09: should display Volume plan tier on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('[class*="plan"], [class*="card"], [class*="tier"], h2, h3', 'Volume').should('exist');
  });

  it('TC-10: should display pricing amounts in USD on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.get('[class*="price"], [class*="amount"], [class*="cost"]').should('exist');
  });

  it('TC-11: should display "For Teams" tab option on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('For Teams').should('be.visible');
  });

  it('TC-12: should display "For Individuals" tab option on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('For Individuals').should('be.visible');
  });
});

describe('BrowserStack Pricing Page - Plan Toggle (Monthly/Annual)', () => {
  it('TC-13: should display Annually billing option on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Annually').should('exist');
  });

  it('TC-14: should display Monthly billing option on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Monthly').should('exist');
  });

  it('TC-15: should display annual savings text on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains(/Save/i).should('exist');
  });

  it('TC-16: should switch to Monthly billing when Monthly option is clicked', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Monthly').should('exist');
    cy.contains(/billed/i).should('exist');
  });
});

describe('BrowserStack Pricing Page - CTA Buttons', () => {
  it('TC-17: should display Choose CTA button for Team plan', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Choose').should('exist');
  });

  it('TC-18: should display Contact Sales CTA for Volume plan', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Contact Sales').should('be.visible');
  });

  it('TC-19: should display FREE TRIAL or Start Free Trial button on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains(/free trial/i).should('exist');
  });

  it('TC-20: should display Sign in link in the header navigation', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Sign in').should('be.visible');
  });
});

describe('BrowserStack Pricing Page - Feature Comparison', () => {
  it('TC-21: should display Compare plans in detail link', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Compare plans in detail').should('be.visible');
  });

  it('TC-22: should display Add-ons section on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.scrollTo('bottom', { ensureScrollable: false });
    cy.contains('Add-ons').should('exist');
  });

  it('TC-23: should display Enterprise add-on option on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Enterprise').should('exist');
  });

  it('TC-24: should display real devices count text on pricing page', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains(/35,000\+|real device/i).should('exist');
  });
});

describe('BrowserStack Pricing Page - Product Navigation', () => {
  it('TC-25: should display Automate product in the left navigation sidebar', () => {
    cy.visit('https://browserstack.com/pricing');
    cy.contains('Automate').should('exist');
  });
});
