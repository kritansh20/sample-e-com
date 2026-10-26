// BrowserStack Docs, Support, and Blog - 25 Cypress Test Cases
// Target: https://browserstack.com

describe('BrowserStack Docs Homepage', () => {
  it('TC01 - docs homepage loads with Documentation heading', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('h1', 'Documentation').should('be.visible');
  });

  it('TC02 - docs page has search input field', () => {
    cy.visit('https://browserstack.com/docs');
    cy.get('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]')
      .should('be.visible');
  });

  it('TC03 - docs page shows popular searches section', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('Popular Searches').should('be.visible');
  });

  it('TC04 - docs page shows Featured Products section', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('FEATURED PRODUCTS').should('be.visible');
  });

  it('TC05 - docs page has Live product card', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('Live').should('exist');
  });

  it('TC06 - docs page has Automate product card', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('Automate').should('exist');
  });

  it('TC07 - docs page has App Automate product card', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('App Automate').should('exist');
  });

  it('TC08 - docs page title contains BrowserStack', () => {
    cy.visit('https://browserstack.com/docs');
    cy.title().should('include', 'BrowserStack');
  });

  it('TC09 - docs page has Discord community link', () => {
    cy.visit('https://browserstack.com/docs');
    cy.contains('Discord').should('exist');
  });
});

describe('BrowserStack Support Page', () => {
  it('TC10 - support page loads with help heading', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('How can we help?').should('be.visible');
  });

  it('TC11 - support page has search input', () => {
    cy.visit('https://browserstack.com/support');
    cy.get('input[placeholder*="Search"], input[type="search"]').should('be.visible');
  });

  it('TC12 - support page shows Popular Questions tab', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Popular Questions').should('exist');
  });

  it('TC13 - support page shows Browse by Topic tab', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Browse by Topic').should('be.visible');
  });

  it('TC14 - support page shows Browse by Products tab', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Browse by Products').should('be.visible');
  });

  it('TC15 - support page shows Most Popular Questions section', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Most Popular Questions').should('be.visible');
  });

  it('TC16 - support page has Ask the Community link', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Ask the Community').should('be.visible');
  });

  it('TC17 - support page shows popular search tags', () => {
    cy.visit('https://browserstack.com/support');
    cy.contains('Popular searches').should('be.visible');
  });

  it('TC18 - support page title contains BrowserStack', () => {
    cy.visit('https://browserstack.com/support');
    cy.title().should('include', 'BrowserStack');
  });
});

describe('BrowserStack Blog Page', () => {
  it('TC19 - blog page loads with BrowserStack Blog heading', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('BrowserStack Blog').should('be.visible');
  });

  it('TC20 - blog page shows category navigation tabs', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('Mobile app testing').should('be.visible');
  });

  it('TC21 - blog page has Home tab active by default', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('Home').should('be.visible');
  });

  it('TC22 - blog page shows Engineering category tab', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('Engineering').should('be.visible');
  });

  it('TC23 - blog page shows Community category tab', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('Community').should('exist');
  });

  it('TC24 - blog page title contains BrowserStack', () => {
    cy.visit('https://browserstack.com/blog');
    cy.title().should('include', 'BrowserStack');
  });

  it('TC25 - blog page shows subtitle about innovation and trends', () => {
    cy.visit('https://browserstack.com/blog');
    cy.contains('innovation').should('be.visible');
  });
});
