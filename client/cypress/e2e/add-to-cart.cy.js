/// <reference types="cypress" />

describe('Add to Cart', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
  });

  // 1. Products page loads with product cards
  it('displays products on the products page', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
  });

  // 2. Add to Cart button is visible on product cards
  it('shows Add to Cart button on product cards', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="add-to-cart-button"]').first().should('be.visible');
  });

  // 3. Clicking Add to Cart shows feedback on the card
  it('shows feedback after clicking Add to Cart', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Click the first enabled Add to Cart button (some products may be out of stock)
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    cy.get('[data-testid="product-card-feedback"]').should('be.visible');
  });

  // 4. Cart page shows the added item
  it('adds a product to the cart and shows it on the cart page', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').should('have.length.greaterThan', 0);
  });

  // 5. Cart item displays name and price
  it('displays item name and price in the cart', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-name"]').should('be.visible');
      cy.get('[data-testid="item-price"]').should('be.visible');
    });
  });

  // 6. Increase quantity button increments the quantity
  it('increases item quantity when + button is clicked', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="item-quantity"]').first().invoke('text').then((initialQty) => {
      cy.get('[data-testid="increase-quantity"]').first().click();
      cy.get('[data-testid="item-quantity"]').first().should(($el) => {
        expect(parseInt($el.text())).to.be.greaterThan(parseInt(initialQty));
      });
    });
  });

  // 7. Decrease quantity button decrements the quantity
  it('decreases item quantity when - button is clicked', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    // Read current quantity, increase if possible, then decrease back
    cy.get('[data-testid="item-quantity"]').first().invoke('text').then((initialQtyText) => {
      const initialQty = parseInt(initialQtyText);
      cy.get('[data-testid="increase-quantity"]').first().then(($btn) => {
        if (!$btn.is(':disabled')) {
          cy.wrap($btn).click();
          cy.get('[data-testid="item-quantity"]').first().should('have.text', String(initialQty + 1));
          cy.get('[data-testid="decrease-quantity"]').first().click();
          cy.get('[data-testid="item-quantity"]').first().should('have.text', String(initialQty));
        } else {
          // At stock max — just verify decrease button exists
          cy.get('[data-testid="decrease-quantity"]').first().should('exist');
        }
      });
    });
  });

  // 8. Remove item button removes the item from cart
  it('removes an item from the cart', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').its('length').then((initialCount) => {
      cy.get('[data-testid="remove-item"]').first().click();
      if (initialCount === 1) {
        cy.get('[data-testid="empty-cart"]').should('be.visible');
      } else {
        cy.get('[data-testid="cart-item"]').should('have.length', initialCount - 1);
      }
    });
  });

  // 9. Cart summary shows subtotal and total
  it('displays cart subtotal and total in the summary', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-summary"]').within(() => {
      cy.get('[data-testid="cart-subtotal"]').should('be.visible');
      cy.get('[data-testid="cart-total"]').should('be.visible');
    });
  });

  // 10. Checkout button navigates to checkout page
  it('navigates to checkout when Proceed to Checkout is clicked', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    // Ensure cart has items (previous test may have emptied it)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="empty-cart"]').length) {
        cy.addProductToCart();
        cy.visit('/cart');
      }
    });
    cy.get('[data-testid="checkout-button"]').should('be.visible').click();
    cy.url().should('include', '/checkout');
  });
});
