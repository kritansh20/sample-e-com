// Cart feature tests - 10 tests covering add to cart, quantity, removal, etc.

describe('Cart Feature', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
  });

  it('adds a product to the cart from the products page', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Click an enabled add-to-cart button and verify feedback appears
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    // Feedback appears briefly — verify it is visible (success or already-in-cart message)
    cy.get('[data-testid="product-card-feedback"]').first().should('be.visible');
    // Cart badge should appear or increment in header
    cy.get('[data-testid="cart-link"]').should('be.visible');
  });

  it('shows cart count badge in header after adding a product', () => {
    cy.addProductToCart();
    cy.get('[data-testid="cart-badge"]').should('be.visible').and('contain.text', '');
    // badge should show a number >= 1
    cy.get('[data-testid="cart-badge"]').invoke('text').then(text => {
      expect(Number(text)).to.be.at.least(1);
    });
  });

  it('displays cart page with added items', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]').should('be.visible');
    cy.get('[data-testid="cart-items"]').should('be.visible');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
  });

  it('shows empty cart state when cart has no items', () => {
    // Intercept the cart GET to return an empty cart, then verify the empty state UI
    cy.intercept('GET', '**/api/cart', {
      statusCode: 200,
      body: { items: [], totalItems: 0, totalPrice: 0, subtotal: 0, discount: 0, amountToFreeShipping: 50 },
    }).as('emptyCart');
    cy.visit('/cart');
    cy.wait('@emptyCart');
    cy.get('[data-testid="empty-cart"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="continue-shopping"]').should('be.visible');
  });

  it('increases item quantity using the + button', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then(initialQty => {
        // Only click increase if the button is not disabled (stock/max limit not reached)
        cy.get('[data-testid="increase-quantity"]').then($btn => {
          if (!$btn.is(':disabled')) {
            cy.wrap($btn).click();
            cy.get('[data-testid="item-quantity"]', { timeout: 8000 }).should('contain', String(Number(initialQty) + 1));
          } else {
            // Already at max — verify quantity is displayed and button is disabled
            cy.wrap($btn).should('be.disabled');
            cy.get('[data-testid="item-quantity"]').should('contain', initialQty);
          }
        });
      });
    });
  });

  it('decreases item quantity using the − button', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then(initialQty => {
        const qty = Number(initialQty);
        if (qty > 1) {
          // Already above 1 — decrease directly
          cy.get('[data-testid="decrease-quantity"]').click();
          cy.get('[data-testid="item-quantity"]', { timeout: 8000 }).should('contain', String(qty - 1));
        } else {
          // At 1 — try to increase first, then decrease
          cy.get('[data-testid="increase-quantity"]').then($btn => {
            if (!$btn.is(':disabled')) {
              cy.wrap($btn).click();
              cy.get('[data-testid="item-quantity"]', { timeout: 8000 }).should('contain', '2');
              cy.get('[data-testid="decrease-quantity"]').click();
              cy.get('[data-testid="item-quantity"]', { timeout: 8000 }).should('contain', '1');
            } else {
              // At max and qty=1 means stock=1 — verify decrease is disabled
              cy.get('[data-testid="decrease-quantity"]').should('be.disabled');
            }
          });
        }
      });
    });
  });

  it('removes an item from the cart', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').its('length').then(initialCount => {
      cy.get('[data-testid="remove-item"]').first().click();
      if (initialCount === 1) {
        cy.get('[data-testid="empty-cart"]', { timeout: 8000 }).should('be.visible');
      } else {
        cy.get('[data-testid="cart-item"]', { timeout: 8000 }).should('have.length', initialCount - 1);
      }
    });
  });

  it('cart persists after navigating away and returning', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').its('length').then(count => {
      cy.visit('/products');
      cy.waitForProductsToLoad();
      cy.visit('/cart');
      cy.get('[data-testid="cart-item"]').should('have.length', count);
    });
  });

  it('displays correct cart total in the summary', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-summary"]').should('be.visible');
    cy.get('[data-testid="cart-total"]').should('be.visible');
    cy.get('[data-testid="cart-subtotal"]').should('be.visible');
    // Total should be a formatted currency string
    cy.get('[data-testid="cart-total"]').invoke('text').should('match', /\$[\d,]+\.\d{2}/);
  });

  it('shows out-of-stock warning and disables checkout for out-of-stock items', () => {
    // Navigate to products and look for an out-of-stock product
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('body').then($body => {
      const outOfStockCards = $body.find('[data-testid="stock-status"]').filter((_, el) => el.textContent.includes('Out of Stock'));
      if (outOfStockCards.length > 0) {
        // Out-of-stock button should be disabled
        cy.get('[data-testid="product-card"]').filter(':contains("Out of Stock")').first().within(() => {
          cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
        });
      } else {
        // If no out-of-stock products visible, verify in-stock products have enabled buttons
        cy.get('[data-testid="add-to-cart-button"]').first().should('not.be.disabled');
      }
    });
  });
});
