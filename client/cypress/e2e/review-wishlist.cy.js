// Review & Wishlist E2E Tests — 20 test cases
// Product used: MacBook Pro 16" (id: 5e8e3a2b-28f2-55df-9c26-4584c60ea909)
// Second product: iPhone 15 Pro (id: 595c5a03-8621-5ab2-87ce-f3a0e636a07d)

const PRODUCT_ID = '5e8e3a2b-28f2-55df-9c26-4584c60ea909';
const PRODUCT_ID_2 = '595c5a03-8621-5ab2-87ce-f3a0e636a07d';
const PRODUCT_URL = `/products/${PRODUCT_ID}`;
const PRODUCT_URL_2 = `/products/${PRODUCT_ID_2}`;

// Helper: delete any review the test user posted on a product
const apiDeleteMyReview = (productId, email = 'john@example.com', password = 'Ecomm@123') => {
  cy.apiLogin(email, password).then(({ token }) => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/products/${productId}/reviews`,
      failOnStatusCode: false
    }).then(({ body }) => {
      cy.apiLogin(email, password).then(({ token: t, user }) => {
        const mine = (body.data?.reviews || []).filter(r => r.userId === user.id);
        mine.forEach(r => {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/products/${productId}/reviews/${r.id}`,
            headers: { Authorization: `Bearer ${t}` },
            failOnStatusCode: false
          });
        });
      });
    });
  });
};

// ─────────────────────────────────────────────
// REVIEW TESTS (10)
// ─────────────────────────────────────────────
describe('Reviews', () => {
  // 1
  it('shows the reviews section with summary on product detail page', () => {
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="reviews-section"]').should('be.visible');
    cy.get('[data-testid="reviews-summary"]').should('be.visible');
    cy.get('[data-testid="reviews-average"]').should('be.visible');
    cy.get('[data-testid="reviews-count"]').should('be.visible');
  });

  // 2
  it('shows rating distribution bars for all 5 star levels', () => {
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
    [1, 2, 3, 4, 5].forEach(n => {
      cy.get(`[data-testid="rating-bar-${n}"]`).should('exist');
    });
  });

  // 3
  it('shows login prompt for unauthenticated users instead of review form', () => {
    cy.clearLocalStorage();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-login-prompt"]').should('be.visible');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

  // 4
  it('shows review form for authenticated users who have not reviewed', () => {
    apiDeleteMyReview(PRODUCT_ID);
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-form"]').should('be.visible');
    cy.get('[data-testid="review-rating"]').should('be.visible');
    cy.get('[data-testid="review-title-input"]').should('be.visible');
    cy.get('[data-testid="review-comment-input"]').should('be.visible');
    cy.get('[data-testid="review-submit-button"]').should('be.visible');
  });

  // 5
  it('shows validation errors when submitting empty review form', () => {
    apiDeleteMyReview(PRODUCT_ID);
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-submit-button"]').click();
    cy.get('[data-testid="review-rating-error"]').should('be.visible');
    cy.get('[data-testid="review-title-error"]').should('be.visible');
    cy.get('[data-testid="review-comment-error"]').should('be.visible');
  });

  // 6
  it('allows selecting a star rating via star buttons', () => {
    apiDeleteMyReview(PRODUCT_ID);
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-star-4"]').click();
    cy.get('[data-testid="review-star-4"]').should('have.attr', 'aria-checked', 'true');
  });

  // 7
  it('successfully submits a valid review and shows success message', () => {
    apiDeleteMyReview(PRODUCT_ID);
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-form"]').should('be.visible');
    cy.get('[data-testid="review-star-5"]').click();
    cy.get('[data-testid="review-title-input"]').type('Excellent product');
    cy.get('[data-testid="review-comment-input"]').type('This is a great product and I highly recommend it to everyone.');
    cy.intercept('POST', '**/reviews').as('postReview');
    cy.get('[data-testid="review-submit-button"]').click();
    cy.wait('@postReview');
    cy.get('[data-testid="review-success"]').should('be.visible');
  });

  // 8
  it('shows already-reviewed message after user posts a review', () => {
    // Ensure a review exists by posting one via API
    cy.apiLogin().then(({ token, user }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/products/${PRODUCT_ID}/reviews`,
        headers: { Authorization: `Bearer ${token}` },
        body: { rating: 3, title: 'Good product', comment: 'Solid build quality and performance overall.' },
        failOnStatusCode: false
      });
    });
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="already-reviewed"]').should('be.visible');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

  // 9
  it('displays posted reviews in the review list with author and title', () => {
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-list"]').should('be.visible');
    cy.get('[data-testid="review-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="review-item-title"]').first().should('be.visible');
    cy.get('[data-testid="review-item-author"]').first().should('be.visible');
    cy.get('[data-testid="review-item-comment"]').first().should('be.visible');
  });

  // 10
  it('allows changing review sort order', () => {
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="review-sort-select"]').should('be.visible');
    cy.get('[data-testid="review-sort-select"]').select('highest');
    cy.get('[data-testid="review-sort-select"]').should('have.value', 'highest');
    cy.get('[data-testid="review-sort-select"]').select('lowest');
    cy.get('[data-testid="review-sort-select"]').should('have.value', 'lowest');
  });
});

// Helper: clear wishlist safely (ignores 404 on already-removed items)
const safeClearWishlist = (email = 'john@example.com', password = 'Ecomm@123') => {
  cy.apiLogin(email, password).then(({ token }) => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/wishlist`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      (body.data?.items || []).forEach(item => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/wishlist/${item.productId}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false
        });
      });
    });
  });
};

// ─────────────────────────────────────────────
// WISHLIST TESTS (10)
// ─────────────────────────────────────────────
describe('Wishlist', () => {
  beforeEach(() => {
    safeClearWishlist();
  });

  // 11
  it('shows empty wishlist state when wishlist has no items', () => {
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]').should('be.visible');
    cy.get('[data-testid="wishlist-empty"]').should('be.visible');
    cy.get('[data-testid="wishlist-count"]').should('contain', '0');
  });

  // 12
  it('wishlist toggle button is present on product detail page', () => {
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="wishlist-toggle"]').should('be.visible');
  });

  // 13
  it('adds a product to wishlist via toggle button on product detail page', () => {
    cy.loginAsTestUser();
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="wishlist-toggle"]').then($btn => {
      if ($btn.attr('aria-pressed') === 'true') {
        // already in wishlist — remove first
        cy.wrap($btn).click();
        cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'false');
      }
    });
    cy.intercept('POST', '**/wishlist').as('addWishlist');
    cy.get('[data-testid="wishlist-toggle"]').click();
    cy.wait('@addWishlist');
    cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'true');
  });

  // 14
  it('removes a product from wishlist via toggle button (toggle off)', () => {
    cy.loginAsTestUser();
    // Add via API using the authenticated session token
    cy.window().then(win => {
      const token = win.localStorage.getItem('authToken');
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.visit(PRODUCT_URL);
    cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'true');
    cy.intercept('DELETE', `**/wishlist/${PRODUCT_ID}`).as('removeWishlist');
    cy.get('[data-testid="wishlist-toggle"]').click();
    cy.wait('@removeWishlist');
    cy.get('[data-testid="wishlist-toggle"]').should('have.attr', 'aria-pressed', 'false');
  });

  // 15
  it('shows added product on the wishlist page with name and price', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-list"]').should('be.visible');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="wishlist-item-name"]').first().should('be.visible');
    cy.get('[data-testid="wishlist-item-price"]').first().should('be.visible');
  });

  // 16
  it('shows stock status for each wishlist item', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item-stock"]').first().should('be.visible');
    cy.get('[data-testid="wishlist-item-stock"]').first().invoke('text').should('match', /In stock|Out of stock/);
  });

  // 17
  it('removes an item from wishlist via Remove button on wishlist page', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="wishlist-remove-button"]').first().click();
    cy.get('[data-testid="wishlist-message"]').should('be.visible');
    cy.get('[data-testid="wishlist-empty"]').should('be.visible');
  });

  // 18
  it('moves a wishlist item to cart via Move to cart button', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
    cy.intercept('POST', `**/wishlist/${PRODUCT_ID}/move-to-cart`).as('moveToCart');
    cy.get('[data-testid="wishlist-move-to-cart"]').first().click();
    cy.wait('@moveToCart');
    cy.get('[data-testid="wishlist-message"]').should('be.visible');
  });

  // 19
  it('wishlist count updates correctly after adding multiple products', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID_2 }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]').should('contain', '2');
    cy.get('[data-testid="wishlist-item"]').should('have.length', 2);
  });

  // 20
  it('wishlist item name links to the product detail page', () => {
    cy.apiLogin().then(({ token }) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/wishlist`,
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: PRODUCT_ID }
      });
    });
    cy.loginAsTestUser();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-item-name"]').first().click();
    cy.url().should('include', `/products/${PRODUCT_ID}`);
    cy.get('[data-testid="product-detail-name"]').should('be.visible');
  });
});
