// Add to Cart - 10 test cases
// Selectors grounded in source: ProductCard.tsx, Cart.tsx, Header.tsx, ProductDetail.tsx, Products.tsx

describe('Add to Cart', () => {
  const email = 'john@example.com';
  const password = 'Ecomm@123';

  // Helper: log in via UI
  const login = () => {
    cy.visit('/login');
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="user-greeting"]', { timeout: 15000 }).should('be.visible');
  };

  // Helper: clear the cart via UI so each test starts clean
  const clearCartViaUI = () => {
    cy.visit('/cart');
    // Wait for cart page to fully load
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="clear-cart"]').length) {
        cy.get('[data-testid="clear-cart"]').click();
        cy.get('[data-testid="confirm-clear-cart"]', { timeout: 8000 }).should('be.visible');
        cy.get('[data-testid="confirm-clear-cart"]').within(() => {
          cy.contains('button', 'Clear cart').click();
        });
        cy.get('[data-testid="empty-cart"]', { timeout: 15000 }).should('be.visible');
      }
    });
  };

  // Helper: add first in-stock product from listing (does not rely on transient feedback)
  const addFirstProductFromListing = () => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    // Only click an enabled (in-stock) add-to-cart button
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    // Wait for cart badge to appear or feedback — either confirms the add succeeded
    cy.get('body', { timeout: 10000 }).should('satisfy', ($body) => {
      return (
        $body.find('[data-testid="cart-badge"]').length > 0 ||
        $body.find('[data-testid="product-card-feedback"]').length > 0
      );
    });
    cy.wait(500); // brief settle for cart state
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-01: Adding a product to cart from the products listing page
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-01: adds a product to cart from the products listing page', () => {
    login();
    clearCartViaUI();

    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // Click the first available in-stock "Add to Cart" button
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();

    // Feedback message appears on the card
    cy.get('[data-testid="product-card-feedback"]', { timeout: 10000 })
      .first()
      .should('contain', 'Added to cart');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-02: Verifying cart count in header updates after adding an item
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-02: cart badge in header updates after adding a product', () => {
    login();
    clearCartViaUI();

    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // Record initial badge state (may not exist yet)
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    cy.get('[data-testid="product-card-feedback"]', { timeout: 10000 }).first().should('contain', 'Added to cart');

    // Cart badge should now show at least 1
    cy.get('[data-testid="cart-badge"]', { timeout: 10000 }).should('be.visible').and('not.have.text', '0');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-03: Adding the same product multiple times and verifying quantity increases
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-03: adding the same product multiple times increases quantity in cart', () => {
    login();
    clearCartViaUI();

    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // Add the first in-stock product twice
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    cy.get('[data-testid="product-card-feedback"]', { timeout: 10000 }).first().should('contain', 'Added to cart');

    cy.get('[data-testid="add-to-cart-button"]:not([disabled])').first().click();
    cy.get('[data-testid="product-card-feedback"]', { timeout: 10000 }).first().should('contain', 'Added to cart');

    // Navigate to cart and verify quantity is 2
    cy.visit('/cart');
    cy.get('[data-testid="item-quantity"]', { timeout: 10000 }).first().should('have.text', '2');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-04: Removing a product from the cart
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-04: removes a product from the cart', () => {
    login();
    clearCartViaUI();
    addFirstProductFromListing();

    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('[data-testid="remove-item"]').first().click();

    // Either cart is empty or the item count decreased
    cy.get('body', { timeout: 10000 }).should('satisfy', ($body) => {
      return (
        $body.find('[data-testid="empty-cart"]').length > 0 ||
        $body.find('[data-testid="cart-message"]').length > 0
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-05: Updating product quantity in the cart
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-05: updates product quantity in the cart using + / − buttons', () => {
    login();
    clearCartViaUI();
    addFirstProductFromListing();

    cy.visit('/cart');
    // Wait for cart to load and confirm exactly 1 item
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).should('have.length', 1);
    cy.get('[data-testid="item-quantity"]').first().should('have.text', '1');

    // Increase quantity and wait for API to settle (button becomes re-enabled)
    cy.get('[data-testid="increase-quantity"]').first().click();
    cy.get('[data-testid="increase-quantity"]').first().should('not.be.disabled');
    cy.get('[data-testid="item-quantity"]', { timeout: 10000 }).first().should('have.text', '2');

    // Decrease quantity back and wait for API to settle
    cy.get('[data-testid="decrease-quantity"]').first().click();
    cy.get('[data-testid="decrease-quantity"]').first().should('be.disabled'); // qty=1 so decrease is disabled
    cy.get('[data-testid="item-quantity"]', { timeout: 10000 }).first().should('have.text', '1');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-06: Verifying cart total price updates correctly
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-06: cart total price updates when quantity changes', () => {
    login();
    clearCartViaUI();
    addFirstProductFromListing();

    cy.visit('/cart');
    cy.get('[data-testid="cart-total"]', { timeout: 10000 }).should('be.visible');

    // Capture initial total
    cy.get('[data-testid="cart-total"]').invoke('text').then((initialTotal) => {
      cy.get('[data-testid="item-price"]').first().invoke('text').then((priceText) => {
        // Increase quantity
        cy.get('[data-testid="increase-quantity"]').first().click();
        cy.get('[data-testid="item-quantity"]', { timeout: 10000 }).first().should('have.text', '2');

        // Total should have changed
        cy.get('[data-testid="cart-total"]').invoke('text').should('not.eq', initialTotal);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07: Attempting to add to cart when not logged in
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-07: add-to-cart button is not shown when user is not logged in', () => {
    // Visit products without logging in
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // ProductCard only renders AddToCartButton when isAuthenticated — so it should not exist
    cy.get('[data-testid="add-to-cart-button"]').should('not.exist');

    // Login link should be visible in header
    cy.get('[data-testid="login-link"]').should('be.visible');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-08: Verifying cart persists after page refresh
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-08: cart contents persist after page refresh', () => {
    login();
    clearCartViaUI();
    addFirstProductFromListing();

    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    // Capture item name before refresh
    cy.get('[data-testid="item-name"]').first().invoke('text').then((itemName) => {
      cy.reload();
      cy.get('[data-testid="cart-item"]', { timeout: 15000 }).should('have.length.at.least', 1);
      cy.get('[data-testid="item-name"]').first().should('have.text', itemName);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-09: Adding a product from the product detail page
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-09: adds a product to cart from the product detail page', () => {
    login();
    clearCartViaUI();

    // Navigate to products and click View Details on the first in-stock product card
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // Find the first product card that has an enabled add-to-cart button, then click its View Details
    cy.get('[data-testid="product-card"]').each(($card) => {
      if ($card.find('[data-testid="add-to-cart-button"]:not([disabled])').length > 0) {
        cy.wrap($card).find('[data-testid="view-details-button"]').click();
        return false; // stop iteration
      }
    });

    // On the detail page, click Add to Cart (wait for it to be enabled)
    cy.get('[data-testid="add-to-cart-button"]:not([disabled])', { timeout: 10000 }).should('be.visible').click();

    // Success message appears
    cy.get('[data-testid="product-detail-message"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Added');

    // Cart badge should reflect the addition
    cy.get('[data-testid="cart-badge"]', { timeout: 10000 }).should('be.visible');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-10: Clearing the entire cart
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC-10: clears the entire cart using the Clear cart button', () => {
    login();
    clearCartViaUI();
    addFirstProductFromListing();

    cy.visit('/cart');
    cy.get('[data-testid="cart-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    // Click "Clear cart"
    cy.get('[data-testid="clear-cart"]').click();

    // Confirm dialog appears
    cy.get('[data-testid="confirm-clear-cart"]', { timeout: 8000 }).should('be.visible');

    // Confirm the action
    cy.get('[data-testid="confirm-clear-cart"]').within(() => {
      cy.contains('button', 'Clear cart').click();
    });

    // Cart should now be empty
    cy.get('[data-testid="empty-cart"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cart-message"]').should('contain', 'cleared');
  });
});
