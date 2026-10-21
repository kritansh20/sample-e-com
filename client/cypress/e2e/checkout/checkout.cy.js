// Checkout feature tests
// Target: https://gcc-habits-lone-edge.trycloudflare.com

const shippingAddress = {
  fullName: 'Test User',
  phone: '5551234567',
  street: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  country: 'United States',
};

const validCard = {
  name: 'Test User',
  number: '4111 1111 1111 1111',
  expiry: '12/26',
  cvv: '123',
};

function clearSavedAddresses() {
  cy.apiLogin().then(({ token }) => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/addresses`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const addresses = body.data || body || [];
      addresses.forEach(addr => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/addresses/${addr.id}`,
          headers: { Authorization: `Bearer ${token}` }
        });
      });
    });
  });
}

function fillShippingAddress(addr = shippingAddress) {
  // Re-query each field individually to avoid detached-DOM issues from React re-renders
  cy.get('[data-testid="shipping-fullName-input"]').should('be.visible').clear().type(addr.fullName);
  cy.get('[data-testid="shipping-phone-input"]').should('be.visible').clear().type(addr.phone);
  cy.get('[data-testid="shipping-street-input"]').should('be.visible').clear().type(addr.street);
  cy.get('[data-testid="shipping-city-input"]').should('be.visible').clear().type(addr.city);
  cy.get('[data-testid="shipping-state-input"]').should('be.visible').clear().type(addr.state);
  cy.get('[data-testid="shipping-zipCode-input"]').should('be.visible').clear().type(addr.zipCode);
}

function fillCardDetails(card = validCard) {
  cy.get('[data-testid="card-name-input"]').clear().type(card.name);
  cy.get('[data-testid="card-number-input"]').clear().type(card.number);
  cy.get('[data-testid="card-expiry-input"]').clear().type(card.expiry);
  cy.get('[data-testid="card-cvv-input"]').clear().type(card.cvv);
}

function addProductAndGoToCheckout() {
  cy.apiClearCart();
  cy.addProductToCart();
  cy.visit('/checkout');
  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
}

function addProductAndGoToCheckoutFresh() {
  clearSavedAddresses();
  cy.apiClearCart();
  cy.addProductToCart();
  cy.visit('/checkout');
  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
  // With no saved addresses, the form renders immediately
  cy.get('[data-testid="shipping-form"]', { timeout: 15000 }).should('be.visible');
}

describe('Checkout', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
  });

  it('(1) checkout page is accessible from cart', () => {
    cy.apiClearCart();
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').should('be.visible').click();
    cy.url().should('include', '/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
  });

  it('(2) order summary shows correct items and prices', () => {
    addProductAndGoToCheckout();
    cy.get('[data-testid="order-summary"]').should('be.visible');
    cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="order-subtotal"]').should('be.visible');
    cy.get('[data-testid="order-total"]').should('be.visible');
    cy.get('[data-testid="order-shipping"]').should('be.visible');
    cy.get('[data-testid="order-tax"]').should('be.visible');
  });

  it('(3) shipping address form fields are visible and fillable', () => {
    addProductAndGoToCheckoutFresh();
    cy.get('[data-testid="shipping-fullName-input"]').should('be.visible').clear().type(shippingAddress.fullName);
    cy.get('[data-testid="shipping-phone-input"]').should('be.visible').clear().type(shippingAddress.phone);
    cy.get('[data-testid="shipping-street-input"]').should('be.visible').clear().type(shippingAddress.street);
    cy.get('[data-testid="shipping-city-input"]').should('be.visible').clear().type(shippingAddress.city);
    cy.get('[data-testid="shipping-state-input"]').should('be.visible').clear().type(shippingAddress.state);
    cy.get('[data-testid="shipping-zipCode-input"]').should('be.visible').clear().type(shippingAddress.zipCode);
    cy.get('[data-testid="shipping-country-select"]').should('be.visible');
  });

  it('(4) form validation — required fields are enforced', () => {
    addProductAndGoToCheckoutFresh();
    // Clear any pre-filled values and attempt to place order
    cy.get('[data-testid="shipping-fullName-input"]').clear();
    cy.get('[data-testid="shipping-phone-input"]').clear();
    cy.get('[data-testid="shipping-street-input"]').clear();
    cy.get('[data-testid="shipping-city-input"]').clear();
    cy.get('[data-testid="shipping-state-input"]').clear();
    cy.get('[data-testid="shipping-zipCode-input"]').clear();
    cy.get('[data-testid="place-order-button"]').click();
    // Should show validation errors
    cy.get('[data-testid="checkout-error"]').should('be.visible');
    cy.get('[data-testid="shipping-fullName-error"]').should('be.visible');
    cy.get('[data-testid="shipping-street-error"]').should('be.visible');
    cy.get('[data-testid="shipping-city-error"]').should('be.visible');
    cy.get('[data-testid="shipping-zipCode-error"]').should('be.visible');
  });

  it('(5) invalid zip/postal code shows error', () => {
    addProductAndGoToCheckoutFresh();
    fillShippingAddress({ ...shippingAddress, zipCode: 'INVALID' });
    cy.get('[data-testid="place-order-button"]').click();
    cy.get('[data-testid="shipping-zipCode-error"]').should('be.visible')
      .and('contain', 'valid postal code');
  });

  it('(6) placing order with valid address succeeds and shows confirmation', () => {
    addProductAndGoToCheckoutFresh();
    fillShippingAddress();
    fillCardDetails();
    cy.intercept('POST', '**/api/orders').as('placeOrder');
    cy.get('[data-testid="place-order-button"]').click();
    cy.wait('@placeOrder', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.url({ timeout: 15000 }).should('include', '/orders/');
  });

  it('(7) order confirmation shows order ID or success message', () => {
    addProductAndGoToCheckoutFresh();
    fillShippingAddress();
    fillCardDetails();
    cy.intercept('POST', '**/api/orders').as('placeOrder');
    cy.get('[data-testid="place-order-button"]').click();
    cy.wait('@placeOrder', { timeout: 20000 });
    cy.url({ timeout: 15000 }).should('include', '/orders/');
    cy.get('[data-testid="order-detail-message"]', { timeout: 10000 })
      .should('contain', 'Thank you');
    cy.get('[data-testid="order-detail-number"]').should('be.visible');
  });

  it('(8) completed order appears in /orders page', () => {
    // Place an order first
    addProductAndGoToCheckoutFresh();
    fillShippingAddress();
    fillCardDetails();
    cy.intercept('POST', '**/api/orders').as('placeOrder');
    cy.get('[data-testid="place-order-button"]').click();
    cy.wait('@placeOrder', { timeout: 20000 });
    cy.url({ timeout: 15000 }).should('include', '/orders/');
    // Navigate to orders list
    cy.visit('/orders');
    cy.get('[data-testid="orders-page"]').should('be.visible');
    cy.get('[data-testid="order-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="order-card"]').should('have.length.at.least', 1);
  });

  it('(9) empty cart redirects away from checkout or shows empty state', () => {
    cy.apiClearCart();
    cy.visit('/checkout');
    // App shows empty state at /checkout when cart is empty (no redirect)
    cy.get('[data-testid="checkout-empty"]', { timeout: 15000 }).should('be.visible')
      .and('contain', 'cart is empty');
  });

  it('(10) coupon/discount code field visible and accepts input (or gracefully absent)', () => {
    addProductAndGoToCheckout();
    // Check if coupon field exists; if so, interact with it; if not, verify order summary is still functional
    cy.get('body').then($body => {
      const couponInput = $body.find('[data-testid="coupon-input"], input[placeholder*="coupon"], input[placeholder*="promo"], input[name*="coupon"], input[id*="coupon"]');
      if (couponInput.length > 0) {
        cy.wrap(couponInput.first()).type('TESTCODE10');
        cy.wrap(couponInput.first()).should('have.value', 'TESTCODE10');
      } else {
        // Coupon field is gracefully absent; order summary should still be visible
        cy.get('[data-testid="order-summary"]').should('be.visible');
        cy.get('[data-testid="order-total"]').should('be.visible');
      }
    });
  });
});
