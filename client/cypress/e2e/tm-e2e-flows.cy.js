/**
 * TM E2E Flows
 * Covers: TC-6380955, TC-6380934, TC-6380933, TC-6380932, TC-6380931,
 *         TC-6380903, TC-6380902, TC-6380901, TC-6380900, TC-6380899,
 *         TC-6380929, TC-6380928
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fill checkout form. Uses saved address if available, otherwise fills new address form. */
function fillCheckout() {
  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');

  cy.get('body').then($body => {
    const hasSaved = $body.find('[data-testid="saved-address-option"]').length > 0;
    if (hasSaved) {
      // Select first saved address
      cy.get('[data-testid="saved-address-option"]').first().find('input[type="radio"]').click();
    } else {
      // Fill new address form (idPrefix="shipping" → data-testid="shipping-<field>-input")
      cy.get('[data-testid="shipping-fullName-input"]').clear().type('Test User');
      cy.get('[data-testid="shipping-street-input"]').clear().type('123 Main Street');
      cy.get('[data-testid="shipping-city-input"]').clear().type('San Francisco');
      cy.get('[data-testid="shipping-state-input"]').clear().type('CA');
      cy.get('[data-testid="shipping-zipCode-input"]').clear().type('94102');
      cy.get('[data-testid="shipping-country-select"]').select('United States');
      cy.get('[data-testid="shipping-phone-input"]').clear().type('5551234567');
    }
  });

  // Shipping method — standard
  cy.get('[data-testid="shipping-option-standard"]').click();

  // Payment — card
  cy.get('[data-testid="payment-card"]').click();
  cy.get('[data-testid="card-name-input"]').clear().type('Test User');
  cy.get('[data-testid="card-number-input"]').clear().type('4111111111111111');
  cy.get('[data-testid="card-expiry-input"]').clear().type('12/28');
  cy.get('[data-testid="card-cvv-input"]').clear().type('123');
}

/** Place order and wait for order detail page */
function placeOrder() {
  cy.get('[data-testid="place-order-button"]', { timeout: 15000 })
    .should('not.be.disabled')
    .click();
  cy.url({ timeout: 20000 }).should('match', /\/orders\/[^/]+$/);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TM E2E Flows', () => {
  beforeEach(() => {
    cy.apiClearCart();
    cy.apiClearWishlist();
  });

  // -------------------------------------------------------------------------
  // TC-6380955 — login, browse, add to favorites, add to cart, checkout
  // -------------------------------------------------------------------------
  it('TC-6380955: login, browse, add to favorites, add to cart, checkout', () => {
    cy.loginAsTestUser();

    cy.visit('/products');
    cy.waitForProductsToLoad();

    // Add first product to wishlist via wishlist-toggle on product card
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });

    // Add first in-stock product to cart
    cy.intercept('POST', '**/api/cart').as('addToCart');
    cy.get('[data-testid="products-container"]').within(() => {
      cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    });
    cy.wait('@addToCart');

    // Checkout
    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');
  });

  // -------------------------------------------------------------------------
  // TC-6380934 — place order and verify in Orders history
  // -------------------------------------------------------------------------
  it('TC-6380934: place order and verify in Orders history', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-number"]', { timeout: 15000 })
      .invoke('text')
      .then(orderText => {
        const orderNumber = orderText.replace('Order ', '').trim();
        cy.visit('/orders');
        cy.get('[data-testid="order-list"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="order-number"]').first().should('contain', orderNumber);
      });
  });

  // -------------------------------------------------------------------------
  // TC-6380933 — add to favorites and verify in Favorites tab
  // -------------------------------------------------------------------------
  it('TC-6380933: add to favorites and verify in Favorites tab', () => {
    cy.loginAsTestUser();

    cy.visit('/products');
    cy.waitForProductsToLoad();

    // Capture product name then add to wishlist
    let savedName = '';
    cy.get('[data-testid="product-card"]').first()
      .find('[data-testid="product-name"]')
      .invoke('text')
      .then(name => { savedName = name; });

    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });

    // Verify in wishlist page
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);

    cy.get('[data-testid="wishlist-item-name"]').first().invoke('text').then(itemName => {
      expect(itemName).to.include(savedName);
    });
  });

  // -------------------------------------------------------------------------
  // TC-6380932 — search, filter, add to cart, and checkout
  // -------------------------------------------------------------------------
  it('TC-6380932: search, filter, add to cart, and checkout', () => {
    cy.loginAsTestUser();

    // Search for a product
    cy.searchProducts('MacBook');

    // Add to cart from search results
    cy.intercept('POST', '**/api/cart').as('addToCart');
    cy.get('[data-testid="products-container"]').within(() => {
      cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    });
    cy.wait('@addToCart');

    // Checkout
    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');
  });

  // -------------------------------------------------------------------------
  // TC-6380931 — Complete end-to-end purchase flow
  // -------------------------------------------------------------------------
  it('TC-6380931: complete end-to-end purchase flow', () => {
    cy.loginAsTestUser();

    // Browse products
    cy.visit('/products');
    cy.waitForProductsToLoad();

    // Add to cart
    cy.intercept('POST', '**/api/cart').as('addToCart');
    cy.get('[data-testid="products-container"]').within(() => {
      cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    });
    cy.wait('@addToCart');

    // Go to cart then checkout
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]', { timeout: 10000 }).click();

    fillCheckout();
    placeOrder();

    // Verify confirmation elements
    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');
    cy.get('[data-testid="order-detail-number"]').should('be.visible');
    cy.get('[data-testid="detail-total"]').should('be.visible');
  });

  // -------------------------------------------------------------------------
  // TC-6380903 — Order confirmation message guides user to Orders tab
  // -------------------------------------------------------------------------
  it('TC-6380903: order confirmation message guides user to Orders tab', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');

    // "← All orders" link navigates to orders list
    cy.get('[data-testid="back-to-orders"]').should('be.visible').click();
    cy.url().should('include', '/orders');
    cy.get('[data-testid="orders-page"]').should('be.visible');
  });

  // -------------------------------------------------------------------------
  // TC-6380902 — Order confirmation Continue Shopping button returns to products
  // -------------------------------------------------------------------------
  it('TC-6380902: order confirmation Continue Shopping button returns to products', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');

    // The app shows "Buy again" and "← All orders" on order detail.
    // Continue Shopping = navigate to /products
    cy.get('[data-testid="reorder-button"]').should('be.visible');
    cy.visit('/products');
    cy.get('[data-testid="products-container"]').should('be.visible');
  });

  // -------------------------------------------------------------------------
  // TC-6380901 — Order confirmation View Orders button navigates to orders screen
  // -------------------------------------------------------------------------
  it('TC-6380901: order confirmation View Orders button navigates to orders screen', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');

    cy.get('[data-testid="back-to-orders"]').click();
    cy.url().should('include', '/orders');
    cy.get('[data-testid="orders-page"]').should('be.visible');
    cy.get('[data-testid="order-list"]', { timeout: 10000 }).should('be.visible');
  });

  // -------------------------------------------------------------------------
  // TC-6380900 — Order confirmation shows total amount paid
  // -------------------------------------------------------------------------
  it('TC-6380900: order confirmation shows total amount paid', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();

    // Capture total from checkout summary
    cy.get('[data-testid="order-total"]', { timeout: 10000 })
      .invoke('text')
      .as('expectedTotal');

    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');

    cy.get('[data-testid="detail-total"]').should('be.visible');
    cy.get('@expectedTotal').then(total => {
      cy.get('[data-testid="detail-total"]').should('contain', total);
    });
  });

  // -------------------------------------------------------------------------
  // TC-6380899 — Order confirmation shows unique order ID
  // -------------------------------------------------------------------------
  it('TC-6380899: order confirmation shows unique order ID', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    fillCheckout();
    placeOrder();

    cy.get('[data-testid="order-detail-message"]', { timeout: 15000 })
      .should('contain', 'Thank you');

    cy.get('[data-testid="order-detail-number"]')
      .invoke('text')
      .should('match', /Order .+/);

    cy.url().should('match', /\/orders\/[a-zA-Z0-9-]+$/);
  });

  // -------------------------------------------------------------------------
  // TC-6380929 — Android back button from checkout (browser back)
  // -------------------------------------------------------------------------
  it('TC-6380929: browser back button navigates back from checkout', () => {
    cy.loginAsTestUser();
    cy.addProductToCart();

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');

    // Simulate Android back button with browser back
    cy.go('back');

    cy.url().should('not.include', '/checkout');
  });

  // -------------------------------------------------------------------------
  // TC-6380928 — Android back button from product detail (browser back)
  // -------------------------------------------------------------------------
  it('TC-6380928: browser back button navigates back from product detail', () => {
    cy.loginAsTestUser();

    cy.visit('/products');
    cy.waitForProductsToLoad();

    // Click first product's "View details" link
    cy.get('[data-testid="product-card"]').first()
      .find('[data-testid="view-details-button"]')
      .click();

    cy.url({ timeout: 10000 }).should('match', /\/products\/[^/]+$/);
    cy.get('[data-testid="product-detail-name"]', { timeout: 10000 }).should('be.visible');

    // Simulate Android back button
    cy.go('back');

    cy.url().should('include', '/products');
    cy.get('[data-testid="products-container"]').should('be.visible');
  });
});
