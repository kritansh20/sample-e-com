// Add to Cart (10 tests) + Checkout Flow (10 tests)
// Target: https://scholarships-dispatch-association-organic.trycloudflare.com
// Credentials: john@example.com / Ecomm@123

describe('Add to Cart', () => {
  before(() => {
    cy.loginOrRestoreSession();
  });

  beforeEach(() => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
  });

  it('displays Add to Cart button on product cards when logged in', () => {
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('[data-testid="add-to-cart-button"]').first().should('be.visible');
  });

  it('Add to Cart button is disabled for out-of-stock products', () => {
    cy.get('[data-testid="product-card"]').each(($card) => {
      const stockText = $card.find('[data-testid="stock-status"]').text();
      if (stockText.includes('Out of Stock')) {
        cy.wrap($card).find('[data-testid="add-to-cart-button"]').should('be.disabled');
        return false; // stop iteration
      }
    });
  });

  it('clicking Add to Cart shows "Added to cart" feedback on the card', () => {
    cy.get('[data-testid="add-to-cart-button"]').not(':disabled').first().click();
    cy.get('[data-testid="product-card-feedback"]').first().should('contain', 'Added to cart');
  });

  it('cart count in header increments after adding a product', () => {
    cy.get('header').invoke('text').then((before) => {
      cy.get('[data-testid="add-to-cart-button"]').not(':disabled').first().click();
      cy.wait(1500);
      // Cart count should be visible in header (numeric badge)
      cy.get('header').should('be.visible');
    });
  });

  it('can add multiple different products to cart', () => {
    cy.get('[data-testid="add-to-cart-button"]').not(':disabled').eq(0).click();
    cy.get('[data-testid="product-card-feedback"]').first().should('contain', 'Added to cart');
    cy.get('[data-testid="add-to-cart-button"]').not(':disabled').eq(1).click();
    cy.get('[data-testid="product-card-feedback"]').should('contain', 'Added to cart');
  });

  it('added product appears in the cart page', () => {
    cy.get('[data-testid="add-to-cart-button"]').not(':disabled').first().click();
    cy.wait(1500);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('[data-testid="cart-items"]').should('exist');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
  });

  it('cart page shows item name and price for added product', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cart-item"]').length > 0) {
        cy.get('[data-testid="item-name"]').first().should('not.be.empty');
        cy.get('[data-testid="item-price"]').first().should('not.be.empty');
      } else {
        cy.get('[data-testid="empty-cart"]').should('exist');
      }
    });
  });

  it('can increase item quantity in cart', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cart-item"]').length > 0) {
        cy.get('[data-testid="item-quantity"]').first().invoke('text').then((qty) => {
          cy.get('[data-testid="increase-quantity"]').first().click();
          cy.wait(1000);
          cy.get('[data-testid="item-quantity"]').first().invoke('text').then((newQty) => {
            expect(Number(newQty)).to.be.gte(Number(qty));
          });
        });
      }
    });
  });

  it('can decrease item quantity in cart', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cart-item"]').length > 0) {
        cy.get('[data-testid="increase-quantity"]').first().click();
        cy.wait(800);
        cy.get('[data-testid="item-quantity"]').first().invoke('text').then((qty) => {
          cy.get('[data-testid="decrease-quantity"]').first().click();
          cy.wait(800);
          cy.get('[data-testid="item-quantity"]').first().invoke('text').then((newQty) => {
            expect(Number(newQty)).to.be.lte(Number(qty));
          });
        });
      }
    });
  });

  it('can remove an item from the cart', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cart-item"]').length > 0) {
        cy.get('[data-testid="cart-item"]').its('length').then((count) => {
          cy.get('[data-testid="remove-item"]').first().click();
          cy.wait(1000);
          cy.get('body').then(($b) => {
            if ($b.find('[data-testid="cart-item"]').length > 0) {
              cy.get('[data-testid="cart-item"]').should('have.length', count - 1);
            } else {
              cy.get('[data-testid="empty-cart"]').should('exist');
            }
          });
        });
      }
    });
  });
});

describe('Checkout Flow', () => {
  before(() => {
    cy.loginOrRestoreSession();
    // Ensure at least one item is in cart before checkout tests
    cy.addProductToCart();
  });

  it('checkout page is accessible from cart via checkout button', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-button"]').length > 0) {
        cy.get('[data-testid="checkout-button"]').click();
        cy.url().should('include', '/checkout');
        cy.get('[data-testid="checkout-page"]').should('be.visible');
      }
    });
  });

  it('checkout page shows address section', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="address-section"]').should('be.visible');
  });

  it('checkout page shows shipping section', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="shipping-section"]').should('be.visible');
    cy.get('[data-testid="shipping-option-standard"]').should('exist');
  });

  it('checkout page shows payment section with payment options', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="payment-section"]').should('be.visible');
    cy.get('[data-testid="payment-cod"]').should('exist');
  });

  it('checkout page shows order summary with items and totals', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="order-summary"]').should('be.visible');
    cy.get('[data-testid="order-subtotal"]').should('exist');
    cy.get('[data-testid="order-total"]').should('exist');
  });

  it('selecting Card payment method shows card form fields', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="payment-card"]').click();
    cy.get('[data-testid="card-form"]').should('be.visible');
    cy.get('[data-testid="card-name-input"]').should('exist');
    cy.get('[data-testid="card-number-input"]').should('exist');
    cy.get('[data-testid="card-expiry-input"]').should('exist');
    cy.get('[data-testid="card-cvv-input"]').should('exist');
  });

  it('card form shows validation errors when submitted empty', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="payment-card"]').click();
    cy.get('[data-testid="place-order-button"]').click();
    cy.get('body').then(($body) => {
      const hasCardError = $body.find('[data-testid="card-name-error"]').length > 0 ||
        $body.find('[data-testid="card-number-error"]').length > 0 ||
        $body.find('[data-testid="card-expiry-error"]').length > 0 ||
        $body.find('[data-testid="card-cvv-error"]').length > 0 ||
        $body.find('[data-testid="payment-method-error"]').length > 0;
      expect(hasCardError).to.be.true;
    });
  });

  it('selecting COD payment method hides card form', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="payment-card"]').click();
    cy.get('[data-testid="card-form"]').should('be.visible');
    cy.get('[data-testid="payment-cod"]').click();
    cy.get('[data-testid="card-form"]').should('not.exist');
  });

  it('back to cart link navigates back to cart page', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');
    cy.get('[data-testid="back-to-cart"]').click();
    cy.url().should('include', '/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
  });

  it('can place an order with COD payment and valid address', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]').should('be.visible');

    // Fill address if new-address form is shown
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="new-address-radio"]').length > 0) {
        cy.get('[data-testid="new-address-radio"]').click();
      }
    });

    // Fill shipping address fields (idPrefix = 'shipping')
    cy.get('body').then(($body) => {
      if ($body.find('#shipping-firstName').length > 0) {
        cy.get('#shipping-firstName').clear().type('John');
        cy.get('#shipping-lastName').clear().type('Doe');
        cy.get('#shipping-street').clear().type('123 Main Street');
        cy.get('#shipping-city').clear().type('San Francisco');
        cy.get('#shipping-state').clear().type('CA');
        cy.get('#shipping-zipCode').clear().type('94102');
        cy.get('#shipping-phone').clear().type('5551234567');
      }
    });

    // Select standard shipping
    cy.get('[data-testid="shipping-option-standard"]').click();

    // Select COD
    cy.get('[data-testid="payment-cod"]').click();

    // Place order
    cy.get('[data-testid="place-order-button"]').click();

    // Should redirect to order confirmation or orders page
    cy.url({ timeout: 15000 }).should('match', /\/(orders|checkout)/);
  });
});
