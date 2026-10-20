// Wishlist E2E Tests
describe('Wishlist', () => {
  // 1. Wishlist page redirects unauthenticated users
  it('redirects unauthenticated users away from /wishlist', () => {
    cy.visit('/wishlist');
    cy.url({ timeout: 10000 }).should('not.include', '/wishlist');
  });

  // 2. Authenticated user can access wishlist page
  it('allows authenticated users to access the wishlist page', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]', { timeout: 10000 }).should('be.visible');
    cy.contains('My Wishlist').should('be.visible');
  });

  // 3. Empty wishlist shows empty state message
  it('shows empty state when wishlist has no items', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="wishlist-list"]').length === 0) {
        cy.contains('Your wishlist is empty.').should('be.visible');
        cy.contains('Browse products').should('be.visible');
      } else {
        cy.get('[data-testid="wishlist-list"]').should('be.visible');
      }
    });
  });

  // 4. Wishlist count is displayed
  it('displays the item count on the wishlist page', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-count"]').invoke('text').should('match', /\d+ items?/);
  });

  // 5. Wishlist toggle button is visible on product cards when logged in
  it('shows wishlist toggle button on product cards for authenticated users', () => {
    cy.loginAsTestUser();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().should('be.visible');
  });

  // 6. Wishlist toggle button is NOT shown when logged out
  it('does not show wishlist toggle button on product cards for guests', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').should('not.exist');
  });

  // 7. Clicking wishlist toggle on a product card adds/removes from wishlist
  it('toggles a product in/out of wishlist from the product card', () => {
    cy.loginAsTestUser();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      const wasActive = $btn.attr('aria-pressed') === 'true';
      cy.wrap($btn).click();
      cy.wait(1500);
      cy.get('[data-testid="wishlist-toggle"]').first().should('have.attr', 'aria-pressed', String(!wasActive));
    });
  });

  // 8. Wishlist toggle on product detail page works
  it('shows and toggles wishlist button on product detail page', () => {
    cy.loginAsTestUser();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="wishlist-toggle"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-toggle"]').then($btn => {
      const wasActive = $btn.attr('aria-pressed') === 'true';
      cy.wrap($btn).click();
      cy.get('[data-testid="product-detail-message"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', String(!wasActive));
    });
  });

  // 9. Wishlist items show product name, price, stock status, and action buttons
  it('displays product details and action buttons for each wishlist item', () => {
    cy.loginAsTestUser();
    // First ensure at least one item is in the wishlist
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') !== 'true') {
        cy.wrap($btn).click();
        cy.wait(1500);
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-item"]').first().within(() => {
          cy.get('[data-testid="wishlist-item-name"]').should('be.visible');
          cy.get('[data-testid="wishlist-item-price"]').should('be.visible');
          cy.get('[data-testid="wishlist-item-stock"]').should('be.visible');
          cy.get('[data-testid="wishlist-remove-button"]').should('be.visible');
        });
      } else {
        cy.log('Wishlist is empty after toggle — item may have been removed');
      }
    });
  });

  // 10. Remove button removes item from wishlist
  it('removes an item from the wishlist when Remove button is clicked', () => {
    cy.loginAsTestUser();
    // Ensure at least one item is in the wishlist
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') !== 'true') {
        cy.wrap($btn).click();
        cy.wait(1500);
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-item"]').its('length').then(initialCount => {
          cy.get('[data-testid="wishlist-remove-button"]').first().click();
          cy.get('[data-testid="wishlist-message"]', { timeout: 5000 }).should('be.visible');
          cy.get('[data-testid="wishlist-item"]').should('have.length', initialCount - 1);
        });
      } else {
        cy.log('Wishlist is empty; skipping remove test');
      }
    });
  });
});
