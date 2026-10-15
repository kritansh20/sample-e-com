// Cart e2e tests — covers Add to Cart and Cart management features

describe('Cart Management', () => {
  beforeEach(() => {
    // Login via UI, then clear cart via direct API call using the stored token
    cy.loginAsTestUser();
    cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      if (!token) return;
      return cy.request({
        method: 'DELETE',
        url: 'http://localhost:5010/api/cart',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    });
  });

  it('1. cart shows empty state when no items', () => {
    cy.visit('/cart');
    cy.get('[data-testid="empty-cart"]').should('be.visible');
  });

  it('2. add product to cart from products page', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="add-to-cart-button"]').first().click();
    cy.get('[data-testid="product-card-feedback"]').first().should('contain', 'Added to cart');
  });

  it('3. cart item shows product name and price', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Capture name and price before adding to cart
    let savedName, savedPrice;
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="product-name"]').invoke('text').then((t) => { savedName = t.trim(); });
      cy.get('[data-testid="product-price"]').invoke('attr', 'data-price').then((p) => { savedPrice = parseFloat(p); });
      cy.get('[data-testid="add-to-cart-button"]').click();
    });
    cy.get('[data-testid="product-card-feedback"]').first().should('contain', 'Added to cart');
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="item-name"]').first().then(($el) => {
      expect($el.text()).to.include(savedName);
    });
    cy.get('[data-testid="item-price"]').first().then(($el) => {
      expect($el.text()).to.include(savedPrice.toFixed(2));
    });
  });

  it('4. increase item quantity', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then((qty) => {
        const before = parseInt(qty.trim(), 10);
        cy.get('[data-testid="increase-quantity"]').click();
        cy.get('[data-testid="item-quantity"]').should('contain', before + 1);
      });
    });
  });

  it('5. decrease item quantity', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    // First increase so we can decrease without removing
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="increase-quantity"]').click();
    });
    cy.get('[data-testid="cart-item"]').first().within(() => {
      cy.get('[data-testid="item-quantity"]').invoke('text').then((qty) => {
        const before = parseInt(qty.trim(), 10);
        cy.get('[data-testid="decrease-quantity"]').click();
        cy.get('[data-testid="item-quantity"]').should('contain', before - 1);
      });
    });
  });

  it('6. remove item from cart shows success message', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="remove-item"]').first().click();
    cy.get('[data-testid="cart-message"]').should('be.visible');
  });

  it('7. move cart item to wishlist (Save for later)', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="move-to-wishlist"]').first().click();
    // Item should be removed from cart after moving to wishlist
    cy.get('[data-testid="cart-message"]').should('be.visible');
  });

  it('8. apply valid coupon code shows discount', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="coupon-input"]').type('WELCOME10');
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="applied-coupon-code"]').should('contain', 'WELCOME10');
    cy.get('[data-testid="cart-discount"]').should('be.visible');
  });

  it('9. apply invalid coupon shows error', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="coupon-input"]').type('INVALIDCODE999');
    cy.get('[data-testid="apply-coupon-button"]').click();
    cy.get('[data-testid="coupon-error"]').should('be.visible');
  });

  it('10. clear cart confirmation dialog and clearing cart', () => {
    cy.addProductToCart();
    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="clear-cart"]').click();
    // Confirmation dialog should appear
    cy.get('[data-testid="confirm-clear-cart"]').should('be.visible');
    // Click the confirm button inside the dialog
    cy.get('[data-testid="confirm-clear-cart-confirm"]').click();
    // Cart should now be empty
    cy.get('[data-testid="empty-cart"]').should('be.visible');
  });
});
