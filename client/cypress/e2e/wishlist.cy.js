// Wishlist feature – 10 Cypress e2e tests
// Target: http://localhost:5005  (API proxied to http://localhost:5010/api)

describe('Wishlist Feature', () => {
  const apiUrl = () => Cypress.env('apiUrl'); // http://localhost:5010/api

  // Login via API and return the auth token (credentials from cypress.config.js env.testUser)
  const loginAndGetToken = () => {
    const { email, password } = Cypress.env('testUser');
    return cy.request({
      method: 'POST',
      url: `${apiUrl()}/auth/login`,
      body: { email, password },
    }).then((res) => res.body.data?.token || res.body.token);
  };

  // Clear all wishlist items for the test user
  const clearWishlist = (token) => {
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/wishlist`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      const items = res.body?.data?.items || res.body?.items || [];
      items.forEach(({ productId }) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl()}/wishlist/${productId}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      });
    });
  };

  // Add a product to the wishlist via API
  const addToWishlist = (token, productId) => {
    cy.request({
      method: 'POST',
      url: `${apiUrl()}/wishlist`,
      headers: { Authorization: `Bearer ${token}` },
      body: { productId },
    });
  };

  // Fetch products list and return the array
  const getProducts = (token, limit = 20) => {
    return cy.request({
      method: 'GET',
      url: `${apiUrl()}/products?limit=${limit}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      // Shape: { success, data: { data: [...], pagination } }
      return res.body.data?.data || res.body.data || res.body;
    });
  };

  // ── auth setup ────────────────────────────────────────────────────────────

  beforeEach(() => {
    cy.ensureLoggedIn();
  });

  // ── 1. Empty state ────────────────────────────────────────────────────────

  it('1. wishlist page shows empty state when no items', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      cy.visit('/wishlist');
      cy.get('[data-testid="wishlist-empty"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="wishlist-empty"]').should('contain', 'Your wishlist is empty');
    });
  });

  // ── 2. Item count ─────────────────────────────────────────────────────────

  it('2. wishlist item count shown correctly', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 2).then((products) => {
        addToWishlist(token, products[0].id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-count"]', { timeout: 10000 }).should('contain', '1 item');
      });
    });
  });

  // ── 3. Add product to wishlist from product detail page ───────────────────

  it('3. add product to wishlist from product detail page', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 10).then((products) => {
        const inStock = products.find((p) => p.stock > 0);
        cy.visit(`/products/${inStock.id}`);
        cy.get('[data-testid="product-detail-name"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="wishlist-toggle"]').click();
        cy.get('[data-testid="product-detail-message"]', { timeout: 10000 })
          .should('contain', 'Saved to your wishlist');
        cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'true');
      });
    });
  });

  // ── 4. Wishlist item shows product name and price ─────────────────────────

  it('4. wishlist item shows product name and price', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 2).then((products) => {
        addToWishlist(token, products[0].id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).first().within(() => {
          cy.get('[data-testid="wishlist-item-name"]').should('be.visible').and('not.be.empty');
          cy.get('[data-testid="wishlist-item-price"]').should('be.visible').and('not.be.empty');
        });
      });
    });
  });

  // ── 5. Wishlist item shows stock status ───────────────────────────────────

  it('5. wishlist item shows stock status', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 2).then((products) => {
        addToWishlist(token, products[0].id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).first().within(() => {
          cy.get('[data-testid="wishlist-item-stock"]')
            .should('be.visible')
            .invoke('text')
            .should('match', /In stock|Out of stock/);
        });
      });
    });
  });

  // ── 6. Remove item shows success message ──────────────────────────────────

  it('6. remove item from wishlist shows success message', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 2).then((products) => {
        addToWishlist(token, products[0].id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-remove-button"]', { timeout: 10000 }).first().click();
        cy.get('[data-testid="wishlist-message"]', { timeout: 10000 })
          .should('be.visible')
          .and('contain', 'removed from your wishlist');
      });
    });
  });

  // ── 7. Removed item no longer appears ────────────────────────────────────

  it('7. removed item no longer appears in wishlist', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 2).then((products) => {
        addToWishlist(token, products[0].id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-item"]', { timeout: 10000 }).should('have.length', 1);
        cy.get('[data-testid="wishlist-remove-button"]').first().click();
        cy.get('[data-testid="wishlist-empty"]', { timeout: 10000 }).should('be.visible');
      });
    });
  });

  // ── 8. Move item to cart ──────────────────────────────────────────────────

  it('8. move item to cart from wishlist', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 20).then((products) => {
        const inStock = products.find((p) => p.stock > 0);
        addToWishlist(token, inStock.id);
        cy.visit('/wishlist');
        cy.get('[data-testid="wishlist-move-to-cart"]', { timeout: 10000 }).first().click();
        cy.get('[data-testid="wishlist-message"]', { timeout: 10000 })
          .should('be.visible')
          .and('contain', 'moved to your cart');
      });
    });
  });

  // ── 9. Out-of-stock item has disabled Move to Cart button ─────────────────

  it('9. out-of-stock item has disabled Move to Cart button', () => {
    loginAndGetToken().then((token) => {
      clearWishlist(token);
      getProducts(token, 50).then((products) => {
        const outOfStock = products.find((p) => p.stock === 0);
        if (!outOfStock) {
          cy.log('No out-of-stock product found – skipping assertion');
          return;
        }
        addToWishlist(token, outOfStock.id);
        cy.visit('/wishlist');
        cy.get(`[data-testid="wishlist-item"][data-product-id="${outOfStock.id}"]`, { timeout: 10000 })
          .within(() => {
            cy.get('[data-testid="wishlist-move-to-cart"]').should('be.disabled');
          });
      });
    });
  });

  // ── 10. Unauthenticated redirect ──────────────────────────────────────────

  it('10. unauthenticated user is redirected to login when accessing wishlist', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/wishlist');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
