// Test Suite: Shopping Cart and Checkout
// Covers: select items from product listing, add to cart, and complete checkout

describe('Shopping Cart and Checkout', () => {
  beforeEach(() => {
    cy.loginAsTestUser();

    // Stub the addresses API to return empty so the new-address form always shows
    // without a race condition from saved addresses resetting the form
    cy.intercept('GET', '**/api/addresses', { body: [] }).as('getAddresses');
  });

  it('Select multiple items from product listing and complete checkout with credit card', () => {
    cy.visit('/products');

    // Wait for product grid to load
    cy.get('[data-testid="product-grid"]', { timeout: 10000 }).should('be.visible');

    // Add first in-stock product to cart
    cy.get('[data-testid="add-to-cart-button"]').first().click();
    cy.get('[data-testid="product-card-feedback"]').first().should('contain', 'Added to cart');

    // Add second in-stock product to cart
    cy.get('[data-testid="add-to-cart-button"]').eq(1).click();
    cy.get('[data-testid="product-card-feedback"]').eq(1).should('contain', 'Added to cart');

    // Navigate to cart and proceed to checkout
    cy.visit('/cart');
    cy.contains('button', 'Proceed to Checkout').click();
    cy.url().should('include', '/checkout');

    // Wait for the checkout page to fully load (shipping options appear after API calls)
    cy.get('[data-testid="shipping-option-standard"]', { timeout: 10000 }).should('exist');

    // With no saved addresses, the new-address form shows directly
    cy.get('[data-testid="shipping-fullName-input"]', { timeout: 5000 }).should('be.visible');

    // Fill in shipping address using data-testid selectors from AddressForm (idPrefix="shipping")
    cy.get('[data-testid="shipping-fullName-input"]').type('John Doe');
    cy.get('[data-testid="shipping-phone-input"]').type('5551234567');
    cy.get('[data-testid="shipping-street-input"]').type('123 Main St');
    cy.get('[data-testid="shipping-city-input"]').type('San Francisco');
    cy.get('[data-testid="shipping-state-input"]').type('CA');
    cy.get('[data-testid="shipping-zipCode-input"]').type('94102');

    // Shipping method: standard is pre-selected; verify it
    cy.get('[data-testid="shipping-option-standard"]').should('be.checked');

    // Payment: select credit card
    cy.get('[data-testid="payment-card"]').click();

    // Fill in card details
    cy.get('[data-testid="card-name-input"]').type('John Doe');
    cy.get('[data-testid="card-number-input"]').type('4111111111111111');
    cy.get('[data-testid="card-expiry-input"]').type('12/26');
    cy.get('[data-testid="card-cvv-input"]').type('123');

    // Place the order
    cy.get('[data-testid="place-order-button"]').click();

    // Verify order confirmation: redirected to /orders/<id>
    cy.url({ timeout: 15000 }).should('match', /\/orders\/[^/]+/);
  });

  it('Select a single item via product detail page and checkout using PayPal', () => {
    cy.visit('/products');

    // Wait for product grid to load
    cy.get('[data-testid="product-grid"]', { timeout: 10000 }).should('be.visible');

    // Click View Details on the first product
    cy.get('[data-testid="view-details-button"]').first().click();

    // Verify we are on a product detail page
    cy.url().should('match', /\/products\/.+/);

    // Add the product to cart from the detail page
    cy.get('[data-testid="add-to-cart-button"]').click();
    // ProductDetail uses data-testid="product-detail-message" for the success alert
    cy.get('[data-testid="product-detail-message"]').should('contain', 'Added');

    // Navigate to cart and proceed to checkout
    cy.visit('/cart');
    cy.contains('button', 'Proceed to Checkout').click();
    cy.url().should('include', '/checkout');

    // Wait for the checkout page to fully load (shipping options appear after API calls)
    cy.get('[data-testid="shipping-option-standard"]', { timeout: 10000 }).should('exist');

    // With no saved addresses, the new-address form shows directly
    cy.get('[data-testid="shipping-fullName-input"]', { timeout: 5000 }).should('be.visible');

    // Fill in shipping address
    cy.get('[data-testid="shipping-fullName-input"]').type('John Doe');
    cy.get('[data-testid="shipping-phone-input"]').type('5559876543');
    cy.get('[data-testid="shipping-street-input"]').type('456 Oak Avenue');
    cy.get('[data-testid="shipping-city-input"]').type('Los Angeles');
    cy.get('[data-testid="shipping-state-input"]').type('CA');
    cy.get('[data-testid="shipping-zipCode-input"]').type('90210');

    // Select PayPal as payment method
    cy.get('[data-testid="payment-paypal"]').click();

    // Verify PayPal note is shown (confirming PayPal was selected)
    cy.get('[data-testid="paypal-note"]').should('be.visible');

    // Place the order
    cy.get('[data-testid="place-order-button"]').click();

    // Verify order confirmation: redirected to /orders/<id>
    cy.url({ timeout: 15000 }).should('match', /\/orders\/[^/]+/);
  });
});
