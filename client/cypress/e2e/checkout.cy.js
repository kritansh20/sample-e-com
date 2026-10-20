/// <reference types="cypress" />

describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    // Clear cart then add a fresh product for test isolation
    cy.visit('/cart');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="clear-cart"]').length) {
        cy.get('[data-testid="clear-cart"]').click();
        cy.get('[data-testid="confirm-clear-cart-confirm"]').click();
        cy.get('[data-testid="empty-cart"]', { timeout: 8000 }).should('be.visible');
      }
    });
    cy.addProductToCart();
  });

  // 1. Checkout page loads with address section
  it('displays the checkout page with address section', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="address-section"]').should('be.visible');
  });

  // 2. Checkout page shows shipping section
  it('displays the shipping method section', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="shipping-section"]').should('be.visible');
  });

  // 3. Checkout page shows payment section
  it('displays the payment section', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="payment-section"]').should('be.visible');
  });

  // 4. Order summary shows items and totals
  it('displays order summary with subtotal and total', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="order-summary"]').within(() => {
      cy.get('[data-testid="order-subtotal"]').should('be.visible');
      cy.get('[data-testid="order-total"]').should('be.visible');
    });
  });

  // 5. Order summary shows at least one order item
  it('shows order items in the summary', () => {
    cy.addProductToCart();
    cy.visit('/checkout');
    cy.get('[data-testid="order-summary"]').should('be.visible');
    cy.get('[data-testid="order-item"]').should('have.length.greaterThan', 0);
  });

  // 6. Selecting card payment shows card form
  it('shows card form when card payment is selected', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="payment-card"]').check({ force: true });
    cy.get('[data-testid="card-form"]').should('be.visible');
    cy.get('[data-testid="card-name-input"]').should('be.visible');
    cy.get('[data-testid="card-number-input"]').should('be.visible');
  });

  // 7. Selecting PayPal shows PayPal note
  it('shows PayPal note when PayPal payment is selected', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="payment-paypal"]').check({ force: true });
    cy.get('[data-testid="paypal-note"]').should('be.visible');
  });

  // 8. Back to cart link navigates back to cart
  it('navigates back to cart via Back to cart link', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="back-to-cart"]').click();
    cy.url().should('include', '/cart');
  });

  // 9. Place order with card payment completes and redirects to order detail
  it('places an order with card payment and redirects to order detail', () => {
    cy.visit('/checkout');

    // Select card payment
    cy.get('[data-testid="payment-card"]').check({ force: true });

    // Fill card details
    cy.get('[data-testid="card-name-input"]').clear().type('John Doe');
    cy.get('[data-testid="card-number-input"]').clear().type('4111 1111 1111 1111');
    cy.get('[data-testid="card-expiry-input"]').clear().type('12/26');
    cy.get('[data-testid="card-cvv-input"]').clear().type('123');

    // Select first saved address if available, otherwise use new address
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="new-address-radio"]').length) {
        // Check if there's already a saved address selected; if not, select new
        const hasSavedSelected = $body.find('input[name="address"]:checked').length > 0;
        if (!hasSavedSelected) {
          cy.get('[data-testid="new-address-radio"]').check({ force: true });
          cy.get('[data-testid="address-street-input"]').type('123 Test Street');
          cy.get('[data-testid="address-city-input"]').type('Test City');
          cy.get('[data-testid="address-state-input"]').type('CA');
          cy.get('[data-testid="address-zip-input"]').type('90001');
        }
      }
    });

    // Select first shipping option
    cy.get('[data-testid^="shipping-option-"]').first().check({ force: true });

    // Place order
    cy.get('[data-testid="place-order-button"]').should('not.be.disabled').click();

    // Should redirect to order detail page (ID may be numeric or UUID)
    cy.url({ timeout: 15000 }).should('match', /\/orders\/.+/);
  });

  // 10. Place order with COD payment completes and redirects to order detail
  it('places an order with cash on delivery and redirects to order detail', () => {
    cy.visit('/checkout');

    // Select COD payment
    cy.get('[data-testid="payment-cod"]').check({ force: true });

    // Select first saved address if available
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="new-address-radio"]').length) {
        const hasSavedSelected = $body.find('input[name="address"]:checked').length > 0;
        if (!hasSavedSelected) {
          cy.get('[data-testid="new-address-radio"]').check({ force: true });
          cy.get('[data-testid="address-street-input"]').type('123 Test Street');
          cy.get('[data-testid="address-city-input"]').type('Test City');
          cy.get('[data-testid="address-state-input"]').type('CA');
          cy.get('[data-testid="address-zip-input"]').type('90001');
        }
      }
    });

    // Select first shipping option
    cy.get('[data-testid^="shipping-option-"]').first().check({ force: true });

    // Place order
    cy.get('[data-testid="place-order-button"]').should('not.be.disabled').click();

    // Should redirect to order detail page (ID may be numeric or UUID)
    cy.url({ timeout: 15000 }).should('match', /\/orders\/.+/);
  });
});
