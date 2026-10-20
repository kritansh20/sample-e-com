// Wishlist feature tests
// Covers: wishlist toggle on product cards, /wishlist page display, remove, move to cart

describe('Wishlist', () => {

  // Helper: login and go to products page
  const loginAndGoToProducts = () => {
    cy.loginAsTestUser();
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 1);
  };

  // ── 1. Wishlist toggle button is visible on product cards when logged in ───
  it('shows wishlist toggle buttons on product cards for authenticated users', () => {
    loginAndGoToProducts();
    cy.get('[data-testid="wishlist-toggle"]').first().should('be.visible');
  });

  // ── 2. Wishlist toggle button is NOT shown when logged out ─────────────────
  it('does not show wishlist toggle buttons when user is not logged in', () => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="wishlist-toggle"]').should('not.exist');
  });

  // ── 3. Clicking wishlist toggle adds a product to the wishlist ─────────────
  it('adds a product to the wishlist when the toggle is clicked', () => {
    loginAndGoToProducts();
    // Find a product not yet in wishlist (aria-pressed="false")
    cy.get('[data-testid="wishlist-toggle"][aria-pressed="false"]').first().as('toggleBtn');
    cy.get('@toggleBtn').click();
    // After click the button should become active (aria-pressed="true")
    cy.get('[data-testid="wishlist-toggle"][aria-pressed="true"]').should('exist');
  });

  // ── 4. Clicking an active wishlist toggle removes the product ──────────────
  it('removes a product from the wishlist when the active toggle is clicked again', () => {
    loginAndGoToProducts();
    // Ensure at least one product is in wishlist first
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') === 'false') {
        cy.wrap($btn).click();
        cy.get('[data-testid="wishlist-toggle"][aria-pressed="true"]').first().click();
      } else {
        cy.wrap($btn).click();
      }
      cy.get('[data-testid="wishlist-toggle"][aria-pressed="false"]').should('exist');
    });
  });

  // ── 5. /wishlist page loads and shows the page title ──────────────────────
  it('loads the /wishlist page with a title for authenticated users', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.contains('My Wishlist', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-count"]').should('be.visible');
  });

  // ── 6. /wishlist page shows item count ────────────────────────────────────
  it('displays the correct item count on the wishlist page', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-count"]').invoke('text').should('match', /\d+ items?/);
  });

  // ── 7. Wishlist items show name, price, and stock status ──────────────────
  it('shows product name, price, and stock status for each wishlist item', () => {
    loginAndGoToProducts();
    // Add first product to wishlist if not already there
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') === 'false') {
        cy.wrap($btn).click();
        cy.wait(1000);
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-item"]').first().within(() => {
      cy.get('[data-testid="wishlist-item-name"]').should('be.visible');
      cy.get('[data-testid="wishlist-item-price"]').should('be.visible');
      cy.get('[data-testid="wishlist-item-stock"]').should('be.visible');
    });
  });

  // ── 8. Remove button removes item from wishlist ───────────────────────────
  it('removes an item from the wishlist when the Remove button is clicked', () => {
    loginAndGoToProducts();
    // Ensure at least one item is in wishlist
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') === 'false') {
        cy.wrap($btn).click();
        cy.wait(1000);
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-item"]').its('length').then(initialCount => {
      cy.get('[data-testid="wishlist-remove-button"]').first().click();
      cy.get('[data-testid="wishlist-message"]', { timeout: 10000 }).should('be.visible');
      if (initialCount > 1) {
        cy.get('[data-testid="wishlist-item"]').should('have.length', initialCount - 1);
      }
    });
  });

  // ── 9. Move to cart button is present for in-stock items ─────────────────
  it('shows a Move to cart button for in-stock wishlist items', () => {
    loginAndGoToProducts();
    cy.get('[data-testid="wishlist-toggle"]').first().then($btn => {
      if ($btn.attr('aria-pressed') === 'false') {
        cy.wrap($btn).click();
        cy.wait(1000);
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]', { timeout: 10000 }).should('be.visible');
    // Find an in-stock item and verify Move to cart button exists
    cy.get('[data-testid="wishlist-item"]').each($item => {
      cy.wrap($item).find('[data-testid="wishlist-item-stock"]').invoke('text').then(stockText => {
        if (stockText.includes('In stock')) {
          cy.wrap($item).find('[data-testid="wishlist-move-to-cart"]').should('be.visible').and('not.be.disabled');
          return false; // stop iteration
        }
      });
    });
  });

  // ── 10. Empty wishlist shows empty state message ──────────────────────────
  it('shows an empty state message when the wishlist has no items', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('be.visible');

    // Remove items one at a time until none remain
    const removeNextItem = () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="wishlist-remove-button"]').length > 0) {
          cy.get('[data-testid="wishlist-remove-button"]').first().click();
          cy.get('[data-testid="wishlist-message"]', { timeout: 10000 }).should('be.visible');
          removeNextItem();
        }
      });
    };
    removeNextItem();

    // After all items removed, empty state should be visible
    cy.get('body').should('contain.text', 'empty');
  });
});
