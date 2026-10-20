// Checkout flow tests - 10 tests covering address, shipping, payment, order placement

describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    // Ensure cart has at least one item before each checkout test
    cy.addProductToCart();
  });

  it('redirects to products page when cart is empty', () => {
    // beforeEach already added a product — clear it now
    cy.visit('/cart');
    cy.get('[data-testid="clear-cart"]', { timeout: 10000 }).should('exist').click({ force: true });
    // ConfirmDialog confirm button has testId "confirm-clear-cart-confirm"
    cy.get('[data-testid="confirm-clear-cart-confirm"]', { timeout: 8000 }).click();
    cy.get('[data-testid="empty-cart"]', { timeout: 15000 }).should('be.visible');
    cy.visit('/checkout');
    // Should show empty state on checkout page
    cy.get('[data-testid="checkout-empty"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Your cart is empty').should('be.visible');
  });

  it('displays the checkout page with all sections when cart has items', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="address-section"]').should('be.visible');
    cy.get('[data-testid="shipping-section"]').should('be.visible');
    cy.get('[data-testid="payment-section"]').should('be.visible');
    cy.get('[data-testid="order-summary"]').should('be.visible');
  });

  it('shows order summary with items, subtotal, shipping, tax and total', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="order-summary"]').within(() => {
      cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
      cy.get('[data-testid="order-subtotal"]').should('be.visible');
      cy.get('[data-testid="order-shipping"]').should('be.visible');
      cy.get('[data-testid="order-tax"]').should('be.visible');
      cy.get('[data-testid="order-total"]').should('be.visible');
    });
  });

  it('validates address form fields on submit with empty address', () => {
    cy.visit('/checkout');
    // Ensure new address form is shown (select "Use a new address" if saved addresses exist)
    cy.get('body').then($body => {
      if ($body.find('[data-testid="new-address-radio"]').length > 0) {
        cy.get('[data-testid="new-address-radio"]').click();
      }
    });
    // Wait for quote to load then click place order with empty address
    cy.get('[data-testid="place-order-button"]', { timeout: 15000 }).should('not.be.disabled');
    cy.get('[data-testid="place-order-button"]').click();
    // Should show validation error
    cy.get('[data-testid="checkout-error"]').should('be.visible');
  });

  it('selects a saved address when available', () => {
    cy.visit('/checkout');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="saved-address-option"]').length > 0) {
        cy.get('[data-testid="saved-address-option"]').first().within(() => {
          cy.get('input[type="radio"]').click({ force: true });
        });
        // New address form should be hidden
        cy.get('[data-testid="new-address-radio"]').should('exist');
        cy.get('[data-testid="shipping-form"]').should('not.exist');
      } else {
        // No saved addresses — new address form should be visible
        cy.get('[data-testid="shipping-form"]').should('be.visible');
      }
    });
  });

  it('selects a shipping method and updates the shipping price', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="shipping-section"]').should('be.visible');
    cy.get('body').then($body => {
      // Try to select express shipping if available
      if ($body.find('[data-testid="shipping-option-express"]').length > 0) {
        cy.get('[data-testid="shipping-option-express"]').click({ force: true });
        cy.get('[data-testid="order-shipping"]', { timeout: 8000 }).should('not.contain', '…');
      } else if ($body.find('[data-testid="shipping-option-standard"]').length > 0) {
        cy.get('[data-testid="shipping-option-standard"]').click({ force: true });
        cy.get('[data-testid="order-shipping"]', { timeout: 8000 }).should('not.contain', '…');
      }
    });
  });

  it('selects COD payment method and shows COD limit warning when total exceeds $500', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="payment-cod"]', { timeout: 10000 }).click({ force: true });
    // Card form should not be visible
    cy.get('[data-testid="card-form"]').should('not.exist');
    // If total > $500, placing order should show COD limit error
    cy.get('[data-testid="order-total"]', { timeout: 15000 }).invoke('text').then(totalText => {
      const total = parseFloat(totalText.replace(/[$,]/g, ''));
      if (total > 500) {
        // Fill address if needed
        cy.get('body').then($body => {
          if ($body.find('[data-testid="new-address-radio"]').length > 0) {
            cy.get('[data-testid="new-address-radio"]').click();
          }
          if ($body.find('[data-testid="shipping-fullName-input"]').length > 0) {
            cy.get('[data-testid="shipping-fullName-input"]').type('Test User');
            cy.get('[data-testid="shipping-phone-input"]').type('5551234567');
            cy.get('[data-testid="shipping-street-input"]').type('123 Main Street');
            cy.get('[data-testid="shipping-city-input"]').type('San Francisco');
            cy.get('[data-testid="shipping-state-input"]').type('CA');
            cy.get('[data-testid="shipping-zipCode-input"]').type('94102');
          }
        });
        cy.get('[data-testid="place-order-button"]').click();
        cy.get('[data-testid="payment-method-error"]').should('be.visible');
      } else {
        // COD is valid for this total
        cy.get('[data-testid="payment-cod"]').should('be.checked');
      }
    });
  });

  it('selects card payment method and shows card form', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="payment-card"]').click({ force: true });
    cy.get('[data-testid="card-form"]').should('be.visible');
    cy.get('[data-testid="card-name-input"]').should('be.visible');
    cy.get('[data-testid="card-number-input"]').should('be.visible');
    cy.get('[data-testid="card-expiry-input"]').should('be.visible');
    cy.get('[data-testid="card-cvv-input"]').should('be.visible');
  });

  it('validates card details and shows field errors on invalid input', () => {
    cy.visit('/checkout');
    // Select card payment
    cy.get('[data-testid="payment-card"]').click({ force: true });
    cy.get('[data-testid="card-form"]').should('be.visible');
    // Enter invalid card details (bad expiry month and short CVV)
    cy.get('[data-testid="card-name-input"]').type('Test User');
    cy.get('[data-testid="card-number-input"]').type('1234 5678 9012 3456');
    cy.get('[data-testid="card-expiry-input"]').type('13/99');
    cy.get('[data-testid="card-cvv-input"]').type('12');
    // Wait for quote to load then place order
    cy.get('[data-testid="place-order-button"]', { timeout: 15000 }).should('not.be.disabled');
    cy.get('[data-testid="place-order-button"]').click();
    // Should show validation errors (card expiry invalid, CVV too short)
    cy.get('[data-testid="checkout-error"]').should('be.visible');
  });

  it('completes full checkout flow and redirects to order confirmation', () => {
    cy.visit('/checkout');
    // Handle address section
    cy.get('body').then($body => {
      if ($body.find('[data-testid="new-address-radio"]').length > 0) {
        cy.get('[data-testid="new-address-radio"]').click();
      }
      if ($body.find('[data-testid="shipping-fullName-input"]').length > 0) {
        cy.get('[data-testid="shipping-fullName-input"]').clear().type('Test User');
        cy.get('[data-testid="shipping-phone-input"]').clear().type('5551234567');
        cy.get('[data-testid="shipping-street-input"]').clear().type('123 Main Street');
        cy.get('[data-testid="shipping-city-input"]').clear().type('San Francisco');
        cy.get('[data-testid="shipping-state-input"]').clear().type('CA');
        cy.get('[data-testid="shipping-zipCode-input"]').clear().type('94102');
      }
    });
    // Select standard shipping
    cy.get('body').then($body => {
      if ($body.find('[data-testid="shipping-option-standard"]').length > 0) {
        cy.get('[data-testid="shipping-option-standard"]').click({ force: true });
      }
    });
    // Select card payment and fill valid card details
    cy.get('[data-testid="payment-card"]').click({ force: true });
    cy.get('[data-testid="card-name-input"]').clear().type('Test User');
    cy.get('[data-testid="card-number-input"]').clear().type('4111 1111 1111 1111');
    // Use a future expiry date
    const futureYear = new Date().getFullYear() + 2;
    const expiryStr = `01/${String(futureYear).slice(-2)}`;
    cy.get('[data-testid="card-expiry-input"]').clear().type(expiryStr);
    cy.get('[data-testid="card-cvv-input"]').clear().type('123');
    // Wait for quote to load and place order
    cy.get('[data-testid="place-order-button"]', { timeout: 15000 }).should('not.be.disabled');
    cy.get('[data-testid="place-order-button"]').click();
    // Should redirect to order detail page
    cy.url({ timeout: 15000 }).should('include', '/orders/');
  });
});
