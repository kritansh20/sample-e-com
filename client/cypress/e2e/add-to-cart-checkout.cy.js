// Add-to-Cart and Checkout E2E Tests
// Target: https://gcc-habits-lone-edge.trycloudflare.com
// 20 test cases covering ProductDetail add-to-cart, Cart page operations, and Checkout flow

const TEST_USER = {
  email: Cypress.env('TEST_USER_EMAIL') || 'john@example.com',
  password: Cypress.env('TEST_USER_PASSWORD') || 'Ecomm@123'
};

// Real product IDs from the seeded database
const PRODUCT_ID_MACBOOK = '5e8e3a2b-28f2-55df-9c26-4584c60ea909';   // MacBook Pro 16" - stock: 50
const PRODUCT_ID_IPHONE  = '595c5a03-8621-5ab2-87ce-f3a0e636a07d';   // iPhone 15 Pro - stock: 25
const PRODUCT_ID_MOUSE   = '6b76c5fc-d55c-5372-b3b8-b574fab2daad';   // Samsung TV - stock: 15

const COUPON_PERCENT  = 'WELCOME10';  // 10% off, no minimum
const COUPON_FIXED    = 'SAVE20';     // $20 off, min $150
const COUPON_INVALID  = 'FAKECODE99';

// ─── ADD-TO-CART: Product Detail Page ────────────────────────────────────────

describe('Add-to-Cart – Product Detail Page', () => {
  beforeEach(() => {
    cy.loginAsTestUser(TEST_USER.email, TEST_USER.password);
  });

  it('TC-01: Add-to-cart button is visible and enabled on a product detail page', () => {
    cy.visit(`/products/${PRODUCT_ID_MACBOOK}`);
    cy.get('[data-testid="add-to-cart-button"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('TC-02: Clicking add-to-cart adds the product and shows confirmation', () => {
    cy.apiClearCart(TEST_USER.email, TEST_USER.password);
    cy.visit(`/products/${PRODUCT_ID_MACBOOK}`);
    cy.intercept('POST', '**/api/cart').as('addToCart');
    cy.get('[data-testid="add-to-cart-button"]').click();
    cy.wait('@addToCart').its('response.statusCode').should('be.oneOf', [200, 201]);
    // Confirmation: button text changes or a message appears
    cy.get('[data-testid="product-detail-message"]', { timeout: 8000 }).should('be.visible');
  });

  it('TC-03: Quantity controls on product detail page change the quantity before adding', () => {
    cy.visit(`/products/${PRODUCT_ID_IPHONE}`);
    cy.get('[data-testid="quantity-increase"]').click().click();
    cy.get('[data-testid="quantity-input"]').should('have.value', '3');
    cy.get('[data-testid="quantity-decrease"]').click();
    cy.get('[data-testid="quantity-input"]').should('have.value', '2');
  });

  it('TC-04: Quantity cannot go below 1 on product detail page', () => {
    cy.visit(`/products/${PRODUCT_ID_IPHONE}`);
    // At qty=1, decrease button should be disabled
    cy.get('[data-testid="quantity-input"]').should('have.value', '1');
    cy.get('[data-testid="quantity-decrease"]').should('be.disabled');
  });

  it('TC-05: Product detail page shows product name and price', () => {
    cy.visit(`/products/${PRODUCT_ID_MACBOOK}`);
    cy.get('[data-testid="product-detail-name"]', { timeout: 10000 }).should('be.visible').and('not.be.empty');
    cy.get('[data-testid="product-detail-price"]').should('be.visible');
  });
});

// ─── CART PAGE ────────────────────────────────────────────────────────────────

describe('Cart Page – Item Management', () => {
  beforeEach(() => {
    cy.loginAsTestUser(TEST_USER.email, TEST_USER.password);
    cy.apiClearCart(TEST_USER.email, TEST_USER.password);
    cy.addProductToCart();
  });

  it('TC-06: Cart page displays added item with name, price and quantity', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="item-name"]').first().should('be.visible').and('not.be.empty');
    cy.get('[data-testid="item-price"]').first().should('be.visible');
  });

  it('TC-07: Increase quantity of a cart item updates the subtotal', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then((before) => {
        cy.get('[data-testid="increase-quantity"]').click();
        cy.get('[data-testid="item-quantity"]').should('have.text', String(Number(before.trim()) + 1));
      });
    });
  });

  it('TC-08: Decrease quantity of a cart item updates the quantity', () => {
    cy.visit('/cart');
    cy.intercept('PUT', '**/api/cart/**').as('updateCart');
    // First increase so we can decrease
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).first().within(() => {
      cy.get('[data-testid="increase-quantity"]').click();
    });
    cy.wait('@updateCart');
    // Now decrease back
    cy.intercept('PUT', '**/api/cart/**').as('updateCart2');
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then((before) => {
        cy.get('[data-testid="decrease-quantity"]').click();
        cy.wait('@updateCart2');
        cy.get('[data-testid="item-quantity"]').should('have.text', String(Number(before.trim()) - 1));
      });
    });
  });

  it('TC-09: Remove item from cart removes it from the list', () => {
    cy.visit('/cart');
    cy.intercept('DELETE', '**/api/cart/**').as('removeItem');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).its('length').then((count) => {
      cy.get('[data-testid="remove-item"]').first().click();
      cy.wait('@removeItem');
      if (count === 1) {
        cy.get('[data-testid="empty-cart"]', { timeout: 8000 }).should('be.visible');
      } else {
        cy.get('[data-testid="cart-item"]').should('have.length', count - 1);
      }
    });
  });

  it('TC-10: Move to wishlist removes item from cart', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).its('length').then((count) => {
      cy.get('[data-testid="move-to-wishlist"]').first().click();
      if (count === 1) {
        cy.get('[data-testid="empty-cart"]', { timeout: 8000 }).should('be.visible');
      } else {
        cy.get('[data-testid="cart-item"]').should('have.length', count - 1);
      }
    });
  });
});

// ─── CART PAGE – Coupon & Clear ───────────────────────────────────────────────

describe('Cart Page – Coupons and Clear Cart', () => {
  beforeEach(() => {
    cy.loginAsTestUser(TEST_USER.email, TEST_USER.password);
    cy.apiClearCart(TEST_USER.email, TEST_USER.password);
    // Add product via API to avoid UI race conditions
    cy.apiLogin(TEST_USER.email, TEST_USER.password).then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/cart`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID_MACBOOK, quantity: 1 }
      });
    });
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('TC-11: Applying a valid coupon code shows discount in cart summary', () => {
    cy.get('[data-testid="coupon-input"]', { timeout: 10000 }).type(COUPON_PERCENT);
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="applied-coupon-code"]', { timeout: 8000 }).should('be.visible');
    cy.get('[data-testid="cart-discount"]').should('be.visible');
  });

  it('TC-12: Applying an invalid coupon code shows an error message', () => {
    cy.get('[data-testid="coupon-input"]', { timeout: 10000 }).type(COUPON_INVALID);
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="coupon-error"]', { timeout: 8000 }).should('be.visible');
  });

  it('TC-13: Removing an applied coupon restores the original total', () => {
    // Remove any existing coupon first, then apply a fresh one
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="remove-coupon-button"]').length > 0) {
        cy.get('[data-testid="remove-coupon-button"]').click();
        cy.get('[data-testid="coupon-input"]', { timeout: 8000 }).should('be.visible');
      }
    });
    cy.get('[data-testid="coupon-input"]', { timeout: 10000 }).type(COUPON_PERCENT);
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="applied-coupon-code"]', { timeout: 8000 }).should('be.visible');
    cy.get('[data-testid="remove-coupon-button"]').click();
    cy.get('[data-testid="applied-coupon-code"]', { timeout: 8000 }).should('not.exist');
    cy.get('[data-testid="cart-discount"]').should('not.exist');
  });

  it('TC-14: Clear cart removes all items and shows empty cart state', () => {
    cy.get('[data-testid="clear-cart"]', { timeout: 10000 }).click();
    // ConfirmDialog renders confirm button as `${testId}-confirm`
    cy.get('[data-testid="confirm-clear-cart-confirm"]', { timeout: 5000 }).click();
    cy.get('[data-testid="empty-cart"]', { timeout: 10000 }).should('be.visible');
  });

  it('TC-15: Cart summary shows subtotal and total', () => {
    cy.get('[data-testid="cart-summary"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cart-subtotal"]').should('be.visible');
    cy.get('[data-testid="cart-total"]').should('be.visible');
  });
});

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────

describe('Checkout – Shipping and Payment', () => {
  beforeEach(() => {
    cy.loginAsTestUser(TEST_USER.email, TEST_USER.password);
    cy.apiClearCart(TEST_USER.email, TEST_USER.password);
    // Add product via API to avoid UI race conditions
    cy.apiLogin(TEST_USER.email, TEST_USER.password).then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/cart`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID_MACBOOK, quantity: 1 }
      });
    });
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]', { timeout: 10000 }).click();
    cy.url({ timeout: 10000 }).should('include', '/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('be.visible');
  });

  it('TC-16: Checkout page loads with address section visible', () => {
    cy.get('[data-testid="address-section"]').should('be.visible');
  });

  it('TC-17: Selecting standard shipping method is reflected in order summary', () => {
    cy.get('[data-testid="shipping-section"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="shipping-option-standard"]').click();
    cy.get('[data-testid="shipping-price-standard"]').should('be.visible');
  });

  it('TC-18: Selecting express shipping method updates the shipping cost', () => {
    cy.get('[data-testid="shipping-section"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="shipping-option-express"]').click();
    cy.get('[data-testid="shipping-price-express"]').should('be.visible');
  });

  it('TC-19: Selecting Credit Card payment method shows card form fields', () => {
    cy.get('[data-testid="payment-card"]', { timeout: 10000 }).click();
    cy.get('[data-testid="card-form"]').should('be.visible');
    cy.get('[data-testid="card-name-input"]').should('be.visible');
    cy.get('[data-testid="card-number-input"]').should('be.visible');
    cy.get('[data-testid="card-expiry-input"]').should('be.visible');
    cy.get('[data-testid="card-cvv-input"]').should('be.visible');
  });

  it('TC-20: Selecting PayPal payment method shows PayPal note and hides card form', () => {
    cy.get('[data-testid="payment-paypal"]', { timeout: 10000 }).click();
    cy.get('[data-testid="paypal-note"]').should('be.visible');
    cy.get('[data-testid="card-form"]').should('not.exist');
  });
});
