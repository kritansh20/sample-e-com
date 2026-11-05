/* global cy */
/**
 * Add to Cart feature tests
 * Covers: add to cart from product listing, cart page interactions, quantity, remove, coupon, checkout
 * Source: client/src/components/ProductCard.tsx, client/src/pages/Cart.tsx
 * TM: TC-6451206 (end-to-end add to cart), TC-6451205 (keyboard accessible)
 */

describe('Add to Cart', () => {
  // Credentials sourced from cypress.config.js env.testUser (set via CYPRESS_testUser env var)
  const email = Cypress.env('testUser')?.email || 'john@example.com';
  const password = Cypress.env('testUser')?.password || 'Ecomm@123';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const loginViaApi = () => {
    cy.loginAsTestUser(email, password);
  };

  const visitProducts = () => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 10000 }).should('be.visible');
  };

  // ── Add to Cart button visibility ────────────────────────────────────────────

  it('does not show Add to Cart button when user is not logged in', () => {
    visitProducts();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-button"]').should('not.exist');
    });
  });

  it('shows Add to Cart button for in-stock products when logged in', () => {
    loginViaApi();
    visitProducts();
    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockStatus = $card.find('[data-testid="stock-status"]').text();
      if (stockStatus !== 'Out of Stock') {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').should('be.visible').and('not.be.disabled');
      }
    });
  });

  it('Add to Cart button is disabled for out-of-stock products TC-6451205', () => {
    loginViaApi();
    visitProducts();
    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockStatus = $card.find('[data-testid="stock-status"]').text();
      if (stockStatus === 'Out of Stock') {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').should('be.disabled');
      }
    });
  });

  // ── Add to Cart action ───────────────────────────────────────────────────────

  it('adds an in-stock product to cart and shows feedback TC-6451206', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    visitProducts();

    cy.intercept('POST', '**/api/cart').as('addToCart');

    // Find first in-stock product and add it
    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockStatus = $card.find('[data-testid="stock-status"]').text();
      if (stockStatus !== 'Out of Stock') {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').click();
        return false; // stop iterating
      }
    });

    cy.wait('@addToCart').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get('[data-testid="product-card-feedback"]').should('contain', 'Added to cart');
  });

  it('shows "Adding..." state while add-to-cart request is in flight', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    visitProducts();

    cy.intercept('POST', '**/api/cart', (req) => {
      req.on('response', (res) => { res.setDelay(500); });
    }).as('addToCartSlow');

    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockStatus = $card.find('[data-testid="stock-status"]').text();
      if (stockStatus !== 'Out of Stock') {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').click();
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').should('contain', 'Adding...');
        return false;
      }
    });

    cy.wait('@addToCartSlow');
  });

  // ── Cart page ────────────────────────────────────────────────────────────────

  it('cart page shows added item with correct name and price', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    visitProducts();

    cy.intercept('POST', '**/api/cart').as('addToCart');
    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockStatus = $card.find('[data-testid="stock-status"]').text();
      if (stockStatus !== 'Out of Stock') {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').click();
        return false;
      }
    });

    cy.wait('@addToCart');
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cart-items"]').should('be.visible');
    cy.get('[data-testid="item-name"]').first().should('not.be.empty');
  });

  it('cart page shows empty state when cart has no items', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.visit('/cart');
    cy.get('[data-testid="empty-cart"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="continue-shopping"]').should('be.visible');
  });

  // ── Quantity controls ────────────────────────────────────────────────────────

  it('increases item quantity in cart', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('PUT', '**/api/cart/**').as('updateCart');
    cy.get('[data-testid="item-quantity"]').first().then(($qty) => {
      const before = parseInt($qty.text(), 10);
      cy.get('[data-testid="increase-quantity"]').first().click();
      cy.wait('@updateCart');
      cy.get('[data-testid="item-quantity"]').first().should('have.text', String(before + 1));
    });
  });

  it('decrease-quantity button is disabled when quantity is 1', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="item-quantity"]').first().should('have.text', '1');
    cy.get('[data-testid="decrease-quantity"]').first().should('be.disabled');
  });

  // ── Remove item ──────────────────────────────────────────────────────────────

  it('removes an item from the cart', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('DELETE', '**/api/cart/**').as('removeItem');
    cy.get('[data-testid="remove-item"]').first().click();
    cy.wait('@removeItem');
    cy.get('[data-testid="cart-message"]').should('contain', 'removed from your cart');
  });

  // ── Clear cart ───────────────────────────────────────────────────────────────

  it('clears all items from the cart via confirm dialog', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('DELETE', '**/api/cart').as('clearCart');
    cy.get('[data-testid="clear-cart"]').click();
    cy.get('[data-testid="confirm-clear-cart"]').should('be.visible');
    cy.get('[data-testid="confirm-clear-cart"]').within(() => {
      cy.contains('button', 'Clear cart').click();
    });
    cy.wait('@clearCart');
    cy.get('[data-testid="empty-cart"]', { timeout: 10000 }).should('be.visible');
  });

  // ── Order summary ────────────────────────────────────────────────────────────

  it('cart summary shows subtotal and total', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cart-summary"]').should('be.visible');
    cy.get('[data-testid="cart-subtotal"]').should('not.be.empty');
    cy.get('[data-testid="cart-total"]').should('not.be.empty');
  });

  // ── Coupon ───────────────────────────────────────────────────────────────────

  it('shows error when applying an empty coupon code', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="coupon-error"]').should('contain', 'Enter a coupon code');
  });

  it('shows error when applying an invalid coupon code', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="coupon-input"]').type('INVALIDCOUPON999');
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="coupon-error"]', { timeout: 8000 }).should('be.visible');
  });

  // ── Checkout navigation ──────────────────────────────────────────────────────

  it('Proceed to Checkout button navigates to checkout page', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-button"]').should('not.be.disabled').click();
    cy.url().should('include', '/checkout');
  });

  // ── Move to wishlist ─────────────────────────────────────────────────────────

  it('moves a cart item to wishlist via Save for later', () => {
    loginViaApi();
    cy.apiClearCart(email, password);
    cy.apiClearWishlist(email, password);
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('POST', '**/api/wishlist/**').as('addToWishlist');
    cy.get('[data-testid="move-to-wishlist"]').first().click();
    cy.get('[data-testid="cart-message"]', { timeout: 8000 }).should('contain', 'moved to your wishlist');
  });

  // ── View Details ─────────────────────────────────────────────────────────────

  it('View Details button navigates to product detail page', () => {
    visitProducts();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="view-details-button"]').click();
    });
    cy.url().should('include', '/products/');
  });
});
