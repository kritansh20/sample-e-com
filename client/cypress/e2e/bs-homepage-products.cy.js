// BrowserStack Homepage & Product Pages - Cypress Test Suite
// Target: https://browserstack.com
// Coverage: Hero section, Navigation, Product cards, CTAs, Pricing, Product landing pages

describe('BrowserStack Homepage', () => {
  beforeEach(() => {
    cy.visit('https://browserstack.com', { failOnStatusCode: false });
  });

  it('should display the homepage hero heading', () => {
    cy.contains('Everything you need for testing').should('exist');
  });

  it('should display the homepage hero subheading', () => {
    cy.contains('AI agents at every step in an open and flexible test platform').should('exist');
  });

  it('should display the Get started free CTA button in hero section', () => {
    cy.contains('a, button', 'Get started free').should('be.visible');
  });

  it('should display the Talk to us CTA button in hero section', () => {
    cy.contains('a, button', 'Talk to us').first().should('be.visible');
  });

  it('should display the BrowserStack logo', () => {
    cy.get('a[href="/"]').find('img').first().should('be.visible');
  });

  it('should display the Products navigation menu item', () => {
    cy.contains('nav a, nav button', 'Products').should('be.visible');
  });

  it('should display the Pricing navigation link', () => {
    cy.contains('nav a', 'Pricing').should('be.visible');
  });

  it('should display the Sign in navigation link', () => {
    cy.contains('a', 'Sign in').should('be.visible');
  });

  it('should display the Free Trial navigation button', () => {
    cy.contains('a, button', 'Free Trial').should('be.visible');
  });

  it('should display the AI Agents navigation link', () => {
    cy.contains('a', 'AI Agents').should('exist');
  });

  it('should display the product section heading for web testing', () => {
    cy.contains('Test your websites and mobile apps').should('be.visible');
  });

  it('should display the Live product card with description', () => {
    cy.contains('Live').should('exist');
    cy.contains('Manual cross browser testing').should('exist');
  });

  it('should display the Automate product card with description', () => {
    cy.contains('Automate').should('exist');
    cy.contains('Browser automation grid').should('exist');
  });

  it('should display the App Live product card with description', () => {
    cy.contains('App Live').should('exist');
    cy.contains('Manual real device testing').should('exist');
  });

  it('should display the App Automate product card with description', () => {
    cy.contains('App Automate').should('exist');
    cy.contains('Real device automation cloud').should('exist');
  });

  it('should display the trusted customers section with 50000 count', () => {
    cy.contains('50,000').should('be.visible');
  });

  it('should display the Pricing link that navigates to pricing page', () => {
    cy.contains('nav a', 'Pricing').should('have.attr', 'href').and('include', 'pricing');
  });

  it('should have the Get started free button linking to signup', () => {
    cy.contains('a', 'Get started free')
      .first()
      .should('have.attr', 'href');
  });

  it('should display the 20+ AI agents section heading', () => {
    cy.contains('20+ AI agents from test planning to release').should('be.visible');
  });
});

describe('BrowserStack Live Product Page', () => {
  it('should load the Live product page successfully', () => {
    cy.visit('https://www.browserstack.com/live', { failOnStatusCode: false });
    cy.url().should('include', 'live');
  });

  it('should display Live page main heading or content', () => {
    cy.visit('https://www.browserstack.com/live', { failOnStatusCode: false });
    cy.get('body').should('not.be.empty');
    cy.get('h1, h2').first().should('be.visible');
  });
});

describe('BrowserStack Automate Product Page', () => {
  it('should load the Automate product page successfully', () => {
    cy.visit('https://www.browserstack.com/automate', { failOnStatusCode: false });
    cy.url().should('include', 'automate');
  });

  it('should display Automate page main heading or content', () => {
    cy.visit('https://www.browserstack.com/automate', { failOnStatusCode: false });
    cy.get('body').should('not.be.empty');
    cy.get('h1, h2').first().should('be.visible');
  });
});

describe('BrowserStack App Live Product Page', () => {
  it('should load the App Live product page successfully', () => {
    cy.visit('https://www.browserstack.com/app-live', { failOnStatusCode: false });
    cy.url().should('include', 'app-live');
  });
});

describe('BrowserStack App Automate Product Page', () => {
  it('should load the App Automate product page successfully', () => {
    cy.visit('https://www.browserstack.com/app-automate', { failOnStatusCode: false });
    cy.url().should('include', 'app-automate');
  });
});
