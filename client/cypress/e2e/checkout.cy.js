// Checkout flow e2e tests
// Suite: Cypress e2e (client/cypress/e2e/)

// Luhn-valid test card: 4111 1111 1111 1111 (Visa test card)
const VALID_CARD = {
  name: 'John Doe',
  number: '4111 1111 1111 1111',
  expiry: '12/30',
  cvv: '123',
};

// Helper: if saved addresses exist, switch to "new address" and fill the form.
// If no saved addresses, the new-address form is already shown — just fill it.
const ensureNewAddressAndFill = () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="new-address-radio"]').length > 0) {
      // Saved addresses present — click the "Use a new address" radio
      cy.get('[data-testid="new-address-radio"]').click({ force: true });
      // Wait for React to re-render and show the address form
      cy.get('[data-testid="shipping-fullName-input"]', { timeout: 10000 }).should('exist');
    }
    // Wait for the form to stabilize after any React re-render
    cy.get('[data-testid="shipping-fullName-input"]', { timeout: 10000 }).should('not.be.disabled');
    // Type into each field using separate get() calls to avoid detached DOM issues
    cy.get('[data-testid="shipping-fullName-input"]').type('John Doe', { force: true });
    cy.get('[data-testid="shipping-phone-input"]').type('5551234567', { force: true });
    cy.get('[data-testid="shipping-street-input"]').type('123 Main Street', { force: true });
    cy.get('[data-testid="shipping-city-input"]').type('San Francisco', { force: true });
    cy.get('[data-testid="shipping-state-input"]').type('CA', { force: true });
    cy.get('[data-testid="shipping-zipCode-input"]').type('94110', { force: true });
  });
};

// Helper: fill card form
const fillCard = (card = VALID_CARD) => {
  cy.get('[data-testid="card-name-input"]').clear().type(card.name);
  cy.get('[data-testid="card-number-input"]').clear().type(card.number);
  cy.get('[data-testid="card-expiry-input"]').clear().type(card.expiry);
  cy.get('[data-testid="card-cvv-input"]').clear().type(card.cvv);
};

// Helper: ensure user is on checkout with at least one item in cart
const setupCheckout = () => {
  cy.loginAsTestUser();
  cy.addProductToCart();
  cy.visit('/checkout');
  cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('be.visible');
};

describe('Checkout flow', () => {
  it('1. empty cart redirects to empty state on checkout page', () => {
    cy.loginAsTestUser();
    // Intercept cart API to return empty cart
    cy.intercept('GET', '**/api/cart', { body: { items: [], subtotal: 0 } }).as('emptyCart');
    // Visit checkout with empty cart
    cy.visit('/checkout');
    cy.wait('@emptyCart');
    // Should show empty state
    cy.get('[data-testid="checkout-empty"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-empty"]').should('contain', 'cart is empty');
  });

  it('2. checkout page shows address, shipping, payment sections and order summary', () => {
    setupCheckout();
    cy.get('[data-testid="address-section"]').should('be.visible');
    cy.get('[data-testid="shipping-section"]').should('be.visible');
    cy.get('[data-testid="payment-section"]').should('be.visible');
    cy.get('[data-testid="order-summary"]').should('be.visible');
  });

  it('3. selecting standard shipping method', () => {
    setupCheckout();
    cy.get('[data-testid="shipping-option-standard"]').check({ force: true });
    cy.get('[data-testid="shipping-option-standard"]').should('be.checked');
  });

  it('4. selecting express shipping method updates price', () => {
    setupCheckout();
    // Ensure standard is selected and quote is loaded
    cy.get('[data-testid="shipping-option-standard"]').check({ force: true });
    cy.get('[data-testid="order-shipping"]', { timeout: 8000 }).should('not.contain', '…');
    // Set up intercept BEFORE switching, then capture standard shipping text
    cy.intercept('POST', '**/api/orders/quote').as('quoteRefresh');
    cy.get('[data-testid="order-shipping"]').invoke('text').as('standardShipping');
    // Switch to express
    cy.get('[data-testid="shipping-option-express"]').check({ force: true });
    cy.get('[data-testid="shipping-option-express"]').should('be.checked');
    // Wait for quote to refresh with new shipping method
    cy.wait('@quoteRefresh');
    // Express shipping cost should differ from standard
    cy.get('@standardShipping').then((standardText) => {
      // Poll until the shipping text changes from the standard value
      cy.get('[data-testid="order-shipping"]', { timeout: 8000 }).should('not.eq', standardText);
    });
  });

  it('5. selecting PayPal payment shows PayPal note', () => {
    setupCheckout();
    cy.get('[data-testid="payment-paypal"]').check({ force: true });
    cy.get('[data-testid="payment-paypal"]').should('be.checked');
    cy.get('[data-testid="paypal-note"]').should('be.visible');
    cy.get('[data-testid="paypal-note"]').should('contain', 'PayPal');
  });

  it('6. selecting COD payment method', () => {
    setupCheckout();
    cy.get('[data-testid="payment-cod"]').check({ force: true });
    cy.get('[data-testid="payment-cod"]').should('be.checked');
    // Card form should not be visible
    cy.get('[data-testid="card-form"]').should('not.exist');
    // PayPal note should not be visible
    cy.get('[data-testid="paypal-note"]').should('not.exist');
  });

  it('7. placing order with missing card details shows validation errors', () => {
    setupCheckout();
    // Ensure card payment is selected (default)
    cy.get('[data-testid="payment-card"]').check({ force: true });
    // Use saved address if available; otherwise switch to new address form
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="new-address-radio"]').length === 0) {
        // No saved addresses — new address form is already shown, nothing to do
      }
      // If saved addresses exist, the default saved address is already selected — no action needed
    });
    // Leave card fields empty and click place order
    cy.get('[data-testid="card-name-input"]').clear();
    cy.get('[data-testid="card-number-input"]').clear();
    cy.get('[data-testid="card-expiry-input"]').clear();
    cy.get('[data-testid="card-cvv-input"]').clear();
    cy.get('[data-testid="place-order-button"]').click();
    // Validation errors should appear
    cy.get('[data-testid="card-name-error"]').should('be.visible');
    cy.get('[data-testid="card-number-error"]').should('be.visible');
    cy.get('[data-testid="card-expiry-error"]').should('be.visible');
    cy.get('[data-testid="card-cvv-error"]').should('be.visible');
  });

  it('8. placing order with invalid card number shows error', () => {
    setupCheckout();
    cy.get('[data-testid="payment-card"]').check({ force: true });
    // Use saved address if available; if not, the new address form is already shown
    // (address validation is not the focus of this test — card validation is)
    // Fill card with invalid (non-Luhn) number
    cy.get('[data-testid="card-name-input"]').clear().type('John Doe');
    cy.get('[data-testid="card-number-input"]').clear().type('1234 5678 9012 3456');
    cy.get('[data-testid="card-expiry-input"]').clear().type('12/30');
    cy.get('[data-testid="card-cvv-input"]').clear().type('123');
    cy.get('[data-testid="place-order-button"]').click();
    cy.get('[data-testid="card-number-error"]').should('be.visible');
    cy.get('[data-testid="card-number-error"]').should('contain', 'valid card number');
  });

  it('9. placing order with expired card shows error', () => {
    setupCheckout();
    cy.get('[data-testid="payment-card"]').check({ force: true });
    // Use saved address if available; if not, the new address form is already shown
    // (address validation is not the focus of this test — card expiry validation is)
    // Fill card with expired expiry date
    cy.get('[data-testid="card-name-input"]').clear().type('John Doe');
    cy.get('[data-testid="card-number-input"]').clear().type('4111 1111 1111 1111');
    cy.get('[data-testid="card-expiry-input"]').clear().type('01/20');
    cy.get('[data-testid="card-cvv-input"]').clear().type('123');
    cy.get('[data-testid="place-order-button"]').click();
    cy.get('[data-testid="card-expiry-error"]').should('be.visible');
    cy.get('[data-testid="card-expiry-error"]').should('contain', 'expired');
  });

  it('10. successful order placement with valid card details navigates to order confirmation', () => {
    setupCheckout();
    cy.get('[data-testid="payment-card"]').check({ force: true });
    // Wait for quote to load
    cy.get('[data-testid="order-total"]', { timeout: 10000 }).should('not.contain', '…');
    // Fill address (switch to new address form if saved addresses exist)
    ensureNewAddressAndFill();
    // Fill valid card details
    fillCard();
    cy.get('[data-testid="place-order-button"]').click();
    // Should navigate to order confirmation page
    cy.url({ timeout: 15000 }).should('match', /\/orders\/[a-zA-Z0-9-]+/);
  });
});
