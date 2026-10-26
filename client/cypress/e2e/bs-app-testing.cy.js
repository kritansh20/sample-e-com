// BrowserStack App Live & App Automate - Product Page Tests
// Target: https://browserstack.com/app-live and https://browserstack.com/app-automate

describe('App Live - Product Page', () => {
  it('TC-01: App Live page loads with correct title', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.title().should('include', 'BrowserStack');
  });

  it('TC-02: App Live hero heading contains "Real Devices"', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('h1').should('contain.text', 'Real Devices');
  });

  it('TC-03: App Live page shows "Get Started Free" CTA button', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.contains('a', 'Get Started Free').should('be.visible');
  });

  it('TC-04: App Live navigation bar shows "App Live" brand label', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', 'App Live');
  });

  it('TC-05: App Live page mentions 30,000+ real devices', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', '30,000');
  });

  it('TC-06: App Live page mentions iOS and Android support', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', 'iOS').and('contain.text', 'Android');
  });

  it('TC-07: App Live page has Features navigation link', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.contains('Features').should('be.visible');
  });

  it('TC-08: App Live page has Pricing navigation link', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.contains('Pricing').should('be.visible');
  });

  it('TC-09: App Live page shows trusted customers section', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', '50,000');
  });

  it('TC-10: App Live page has Custom Device Lab link in nav', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', 'Custom Device Lab');
  });

  it('TC-11: App Live page shows Real Device Features in nav', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('body').should('contain.text', 'Real Device Features');
  });

  it('TC-12: App Live page has BrowserStack logo', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.get('img[alt*="BrowserStack"], a[href="/"] img, header img').first().should('be.visible');
  });

  it('TC-13: App Live page has Sign in link', () => {
    cy.visit('https://browserstack.com/app-live');
    cy.contains('Sign in').should('be.visible');
  });
});

describe('App Automate - Product Page', () => {
  it('TC-14: App Automate page loads with correct title', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.title().should('include', 'BrowserStack');
  });

  it('TC-15: App Automate hero heading contains "real devices"', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('h1').should('contain.text', 'real devices');
  });

  it('TC-16: App Automate page shows "Get Started Free" CTA', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'Get Started Free');
  });

  it('TC-17: App Automate page shows "Get a Demo" CTA', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.contains('Get a Demo').should('be.visible');
  });

  it('TC-18: App Automate page mentions Appium framework', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'Appium');
  });

  it('TC-19: App Automate page mentions Espresso framework', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'Espresso');
  });

  it('TC-20: App Automate page mentions XCUITest framework', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'XCUITest');
  });

  it('TC-21: App Automate page mentions Maestro framework', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'Maestro');
  });

  it('TC-22: App Automate page has Features navigation link', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.contains('Features').should('be.visible');
  });

  it('TC-23: App Automate page has AI Agents navigation link', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'AI Agents');
  });

  it('TC-24: App Automate page has Pricing navigation link', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.contains('Pricing').should('be.visible');
  });

  it('TC-25: App Automate page mentions automated mobile app testing', () => {
    cy.visit('https://browserstack.com/app-automate');
    cy.get('body').should('contain.text', 'Automated mobile app');
  });
});
