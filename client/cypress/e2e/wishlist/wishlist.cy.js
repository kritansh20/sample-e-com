// Wishlist feature tests
// Selectors grounded in source: ProductCard.tsx, Wishlist.tsx, Header.tsx

describe('Wishlist Feature', () => {
  beforeEach(() => {
    cy.apiClearWishlist();
    cy.loginAsTestUser();
  });

  // Test 1: wishlist icon/button visible on product card
  it('shows wishlist toggle button on product cards for authenticated users', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').should('be.visible');
    });
  });

  // Test 2: clicking wishlist button adds product to wishlist
  it('clicking wishlist button adds product to wishlist', () => {
    cy.intercept('POST', '**/api/wishlist').as('addWishlist');
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist');
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'true');
    });
  });

  // Test 3: wishlist count in header updates after adding
  it('wishlist count badge in header updates after adding a product', () => {
    cy.intercept('POST', '**/api/wishlist').as('addWishlist');
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Ensure no badge before adding
    cy.get('[data-testid="wishlist-badge"]').should('not.exist');
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist');
    cy.get('[data-testid="wishlist-badge"]').should('be.visible').and('contain', '1');
  });

  // Test 4: navigating to /wishlist shows added product
  it('navigating to /wishlist shows the added product', () => {
    cy.intercept('POST', '**/api/wishlist').as('addWishlist');
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Capture product name before adding
    cy.get('[data-testid="product-card"]').first()
      .find('[data-testid="product-name"]')
      .invoke('text')
      .then((name) => {
        cy.wrap(name).as('productName');
      });
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist');
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]').should('be.visible');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
    cy.get('@productName').then((name) => {
      cy.get('[data-testid="wishlist-item-name"]').first().should('contain', name);
    });
  });

  // Test 5: removing product from wishlist page removes it from list
  it('removing a product from the wishlist page removes it from the list', () => {
    // Add a product via API first
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/products?limit=1`,
      }).then(({ body }) => {
        const productId = body.data.data[0].id;
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/wishlist`,
          headers: { Authorization: `Bearer ${token}` },
          body: { productId },
        });
      });
    });
    cy.intercept('DELETE', '**/api/wishlist/**').as('removeWishlist');
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('[data-testid="wishlist-remove-button"]').first().click();
    cy.wait('@removeWishlist');
    cy.get('[data-testid="wishlist-empty"]').should('be.visible');
  });

  // Test 6: wishlist persists after page reload
  it('wishlist persists after page reload', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.intercept('POST', '**/api/wishlist').as('addWishlist');
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist');
    cy.reload();
    cy.get('header').should('contain', 'Hi,');
    cy.get('[data-testid="wishlist-badge"]', { timeout: 10000 }).should('be.visible').and('contain', '1');
  });

  // Test 7: adding same product twice does not duplicate it
  it('adding the same product twice does not duplicate it in the wishlist', () => {
    cy.intercept('POST', '**/api/wishlist').as('addWishlist');
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist');
    // Toggle off then on again (or try to add again via API)
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]').should('have.length', 1);
    // Go back and click again (should toggle off, not duplicate)
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.intercept('DELETE', '**/api/wishlist/**').as('removeWishlist');
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'true').click();
    });
    cy.wait('@removeWishlist');
    // Add again
    cy.intercept('POST', '**/api/wishlist').as('addWishlist2');
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').click();
    });
    cy.wait('@addWishlist2');
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]').should('have.length', 1);
  });

  // Test 8: wishlist page shows empty state when no items
  it('wishlist page shows empty state when no items are in the wishlist', () => {
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-empty"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-empty"]').should('contain', 'Your wishlist is empty');
  });

  // Test 9: clicking product in wishlist navigates to product detail
  it('clicking a product name in the wishlist navigates to the product detail page', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/products?limit=1`,
      }).then(({ body }) => {
        const productId = body.data.data[0].id;
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/wishlist`,
          headers: { Authorization: `Bearer ${token}` },
          body: { productId },
        });
      });
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item-name"]', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/products\/\w+/);
  });

  // Test 10: unauthenticated user is prompted to login when adding to wishlist
  it('unauthenticated user sees login prompt instead of wishlist button on product cards', () => {
    // Clear session to simulate unauthenticated state
    cy.clearAllStorage();
    cy.clearCookies();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    // Wishlist toggle should not be visible for unauthenticated users
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="wishlist-toggle"]').should('not.exist');
    });
    // Header should show Login link
    cy.get('[data-testid="login-link"]').should('be.visible');
  });
});
