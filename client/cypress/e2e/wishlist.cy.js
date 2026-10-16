// Wishlist feature tests for the e-commerce app
// Selectors sourced from:
//   client/src/components/ProductCard.tsx  — data-testid="wishlist-toggle", "product-card", "product-name", "product-price", "product-image"
//   client/src/pages/Wishlist.tsx          — data-testid="wishlist-page", "wishlist-count", "wishlist-list", "wishlist-item", "wishlist-item-name", "wishlist-item-price", "wishlist-remove-button", "wishlist-move-to-cart", "wishlist-empty", "wishlist-message"
//   client/src/components/Header.tsx       — data-testid="wishlist-link", "wishlist-badge"

const EMAIL = 'john@example.com';
const PASSWORD = 'Ecomm@123';

// Helper: log in via UI using cy.session to cache credentials
function login() {
  cy.session(
    EMAIL,
    () => {
      cy.visit('/login');
      cy.get('#email').clear().type(EMAIL);
      cy.get('#password').clear().type(PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/login');
      cy.get('[data-testid="user-greeting"]', { timeout: 10000 }).should('be.visible');
    },
    {
      validate() {
        cy.visit('/');
        cy.get('[data-testid="user-greeting"]', { timeout: 5000 }).should('be.visible');
      },
    }
  );
}

// Helper: clear wishlist via UI (visit wishlist page and remove all items)
function clearWishlistViaUI() {
  cy.visit('/wishlist');
  cy.get('[data-testid="wishlist-page"]', { timeout: 10000 }).should('be.visible');
  cy.wait(1000);
  // Remove items up to 10 times (handles up to 10 wishlist items)
  for (let i = 0; i < 10; i++) {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-remove-button"]').length > 0) {
        cy.get('[data-testid="wishlist-remove-button"]').first().click();
        cy.wait(800);
      }
    });
  }
  cy.wait(500);
}

// Helper: add first N products to wishlist via products page
function addProductsToWishlist(count = 1) {
  cy.visit('/products');
  cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', count);

  for (let i = 0; i < count; i++) {
    cy.get('[data-testid="wishlist-toggle"]').eq(i).invoke('attr', 'aria-pressed').then((pressed) => {
      if (pressed !== 'true') {
        cy.get('[data-testid="wishlist-toggle"]').eq(i).click();
        cy.wait(800);
      }
    });
  }
  cy.wait(500);
}

describe('Wishlist Feature', () => {
  // ─── TC-1: Add a product to wishlist from the products listing page ───────
  it('TC-1: adds a product to wishlist from the products listing page', () => {
    login();
    clearWishlistViaUI();

    cy.visit('/products');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 1);

    // Ensure first product is NOT in wishlist, then add it
    cy.get('[data-testid="wishlist-toggle"]').first().invoke('attr', 'aria-pressed').then((pressed) => {
      if (pressed === 'true') {
        cy.get('[data-testid="wishlist-toggle"]').first().click();
        cy.wait(800);
      }
    });
    cy.get('[data-testid="wishlist-toggle"]').first().click();
    cy.wait(1000);
    cy.get('[data-testid="wishlist-toggle"]').first().should('have.attr', 'aria-pressed', 'true');
  });

  // ─── TC-2: View the wishlist page with added items ────────────────────────
  it('TC-2: views the wishlist page with added items', () => {
    login();
    clearWishlistViaUI();
    addProductsToWishlist(1);

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-list"]').should('be.visible');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
  });

  // ─── TC-3: Remove a product from the wishlist ─────────────────────────────
  it('TC-3: removes a product from the wishlist', () => {
    login();
    clearWishlistViaUI();
    addProductsToWishlist(1);

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('[data-testid="wishlist-remove-button"]').first().click();
    cy.get('[data-testid="wishlist-message"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-item"]').should('have.length', 0);
  });

  // ─── TC-4: Wishlist count in header updates after adding an item ──────────
  it('TC-4: wishlist count in header updates after adding an item', () => {
    login();
    clearWishlistViaUI();

    cy.visit('/products');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 1);

    // Ensure first product is NOT in wishlist
    cy.get('[data-testid="wishlist-toggle"]').first().invoke('attr', 'aria-pressed').then((pressed) => {
      if (pressed === 'true') {
        cy.get('[data-testid="wishlist-toggle"]').first().click();
        cy.wait(800);
      }
    });

    // Add to wishlist
    cy.get('[data-testid="wishlist-toggle"]').first().click();
    cy.wait(1500);

    // Badge should appear in header
    cy.get('[data-testid="wishlist-badge"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-badge"]').invoke('text').then((text) => {
      expect(parseInt(text, 10)).to.be.at.least(1);
    });
  });

  // ─── TC-5: Attempting to add to wishlist when not logged in ───────────────
  it('TC-5: redirects to login or shows error when adding to wishlist without login', () => {
    // Ensure logged out
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit('/products');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 1);

    // Wishlist toggle should NOT be visible for unauthenticated users
    // (ProductCard only renders it when isAuthenticated)
    cy.get('[data-testid="wishlist-toggle"]').should('not.exist');

    // Navigating directly to /wishlist should redirect to login
    cy.visit('/wishlist');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  // ─── TC-6: Adding multiple products to wishlist ───────────────────────────
  it('TC-6: adds multiple products to wishlist', () => {
    login();
    clearWishlistViaUI();

    cy.visit('/products');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 2);

    // Add first two products
    cy.get('[data-testid="wishlist-toggle"]').eq(0).invoke('attr', 'aria-pressed').then((p) => {
      if (p !== 'true') {
        cy.get('[data-testid="wishlist-toggle"]').eq(0).click();
        cy.wait(800);
      }
    });

    cy.get('[data-testid="wishlist-toggle"]').eq(1).invoke('attr', 'aria-pressed').then((p) => {
      if (p !== 'true') {
        cy.get('[data-testid="wishlist-toggle"]').eq(1).click();
        cy.wait(800);
      }
    });

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 2);
  });

  // ─── TC-7: Wishlist persists after page refresh ───────────────────────────
  it('TC-7: wishlist persists after page refresh', () => {
    login();
    clearWishlistViaUI();
    addProductsToWishlist(1);

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.reload();
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  // ─── TC-8: Moving an item from wishlist to cart ───────────────────────────
  it('TC-8: moves an item from wishlist to cart', () => {
    login();
    clearWishlistViaUI();
    addProductsToWishlist(1);

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    // Only click Move to Cart if the button is not disabled (i.e. item is in stock)
    cy.get('[data-testid="wishlist-move-to-cart"]').first().then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.wrap($btn).click();
        cy.get('[data-testid="wishlist-message"]', { timeout: 10000 })
          .should('be.visible')
          .and('contain', 'moved to your cart');
      } else {
        // Item is out of stock — add a different product
        cy.visit('/products');
        cy.get('[data-testid="product-card"]', { timeout: 15000 }).each(($card, idx) => {
          const stockText = $card.find('[data-testid="stock-status"]').text();
          if (stockText.includes('In stock') || stockText.includes('Only')) {
            cy.get('[data-testid="wishlist-toggle"]').eq(idx).invoke('attr', 'aria-pressed').then((p) => {
              if (p !== 'true') {
                cy.get('[data-testid="wishlist-toggle"]').eq(idx).click();
                cy.wait(800);
              }
            });
            return false; // break each
          }
        });
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-move-to-cart"]').not('[disabled]').first().click();
        cy.get('[data-testid="wishlist-message"]', { timeout: 10000 })
          .should('be.visible')
          .and('contain', 'moved to your cart');
      }
    });
  });

  // ─── TC-9: Verifying empty wishlist state message ─────────────────────────
  it('TC-9: shows empty wishlist state message when wishlist is empty', () => {
    login();
    clearWishlistViaUI();

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="wishlist-count"]').should('contain', '0');
    // EmptyState renders "Your wishlist is empty." text
    // Wishlist.tsx renders: <p>Your wishlist is empty.</p> inside EmptyState
    cy.contains('Your wishlist is empty.').should('be.visible');
  });

  // ─── TC-10: Product details (name, price, image) shown correctly ──────────
  it('TC-10: shows product name, price, and image correctly in wishlist', () => {
    login();
    clearWishlistViaUI();

    // Capture product name from products page before adding
    let productName = '';
    cy.visit('/products');
    cy.get('[data-testid="product-card"]', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('[data-testid="product-name"]').first().invoke('text').then((name) => {
      productName = name.trim();
    });

    // Add first product to wishlist
    cy.get('[data-testid="wishlist-toggle"]').first().invoke('attr', 'aria-pressed').then((pressed) => {
      if (pressed !== 'true') {
        cy.get('[data-testid="wishlist-toggle"]').first().click();
        cy.wait(800);
      }
    });

    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('[data-testid="wishlist-item"]').first().within(() => {
      // Image
      cy.get('img').should('be.visible').and('have.attr', 'src').and('not.be.empty');
      // Name
      cy.get('[data-testid="wishlist-item-name"]').should('be.visible').and('not.be.empty');
      // Price
      cy.get('[data-testid="wishlist-item-price"]').should('be.visible').and('not.be.empty');
    });

    // Verify the product name matches what was on the products page
    cy.get('[data-testid="wishlist-item-name"]').first().invoke('text').then((wishlistName) => {
      expect(wishlistName.trim()).to.equal(productName);
    });
  });
});
