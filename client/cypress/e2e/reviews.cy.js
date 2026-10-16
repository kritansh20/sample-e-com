/**
 * Product Reviews Feature Tests
 * Covers: viewing, submitting, validation, author/date display, star ratings, duplicates
 *
 * Uses MacBook Pro 16" product: /products/9c8ca16b-0313-4ab2-80f9-0ef63ff0564f
 * This product has existing reviews (Marcus L., Priya S.) and john may or may not have one.
 */

const PRODUCT_ID = '9c8ca16b-0313-4ab2-80f9-0ef63ff0564f';
const PRODUCT_URL = `/products/${PRODUCT_ID}`;
const TEST_USER = { email: 'john@example.com', password: 'Ecomm@123' };
const BASE_URL = 'https://deny-anyone-hotels-programme.trycloudflare.com';

// Login via UI
function loginAsJohn() {
  cy.loginAsTestUser(TEST_USER.email, TEST_USER.password);
}

// Navigate to the product page and wait for reviews section to load
function goToProduct() {
  cy.visit(PRODUCT_URL);
  cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
}

// Delete john's review via API if it exists, then navigate to product page
// Returns a Cypress chain that resolves after deletion (or no-op if no review)
function deleteJohnReviewViaApi() {
  // Login via API to get token
  cy.request({
    method: 'POST',
    url: `${BASE_URL}/api/auth/login`,
    body: { email: TEST_USER.email, password: TEST_USER.password },
    failOnStatusCode: false,
  }).then((loginResp) => {
    if (loginResp.status !== 200) return;
    const token = loginResp.body.data?.token || loginResp.body.token;

    // Get reviews for this product
    cy.request({
      method: 'GET',
      url: `${BASE_URL}/api/products/${PRODUCT_ID}/reviews`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((reviewsResp) => {
      if (reviewsResp.status !== 200) return;
      const reviews = reviewsResp.body.reviews || reviewsResp.body.data?.reviews || [];
      // Find john's review (the one with a delete button — owned by the logged-in user)
      // We identify it by checking if the user's own review exists
      const johnReview = reviews.find((r) => r.authorName && r.authorName.startsWith('John'));
      if (johnReview) {
        cy.request({
          method: 'DELETE',
          url: `${BASE_URL}/api/products/${PRODUCT_ID}/reviews/${johnReview.id}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      }
    });
  });
}

describe('Product Reviews Feature', () => {

  // ─── TC1: Viewing reviews on a product detail page ───────────────────────
  it('TC1: should display the reviews section on a product detail page', () => {
    goToProduct();

    cy.get('[data-testid="reviews-section"]').should('be.visible');
    cy.get('[data-testid="reviews-section"]').should('contain', 'Customer Reviews');
    cy.get('[data-testid="reviews-summary"]').should('be.visible');
    cy.get('[data-testid="reviews-average"]').should('be.visible');
    cy.get('[data-testid="reviews-count"]').should('be.visible');
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
    cy.get('[data-testid="review-list"]').should('exist');
    // This product has known reviews (Marcus L., Priya S.)
    cy.get('[data-testid="review-item"]').should('have.length.at.least', 1);
  });

  // ─── TC2: Submitting a new review when logged in (rating + comment) ───────
  it('TC2: should allow a logged-in user to submit a review with rating and comment', () => {
    deleteJohnReviewViaApi();
    loginAsJohn();
    goToProduct();

    cy.get('[data-testid="review-form"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="review-star-4"]').click();
    cy.get('[data-testid="review-title-input"]').type('Great product overall');
    cy.get('[data-testid="review-comment-input"]').type('This is a well-made product that exceeded my expectations. Highly recommended!');
    cy.get('[data-testid="review-submit-button"]').click();
    cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('contain', 'Thanks! Your review has been posted.');
    cy.get('[data-testid="review-list"]').should('contain', 'Great product overall');
  });

  // ─── TC3: Attempting to submit a review without being logged in ───────────
  it('TC3: should show login prompt instead of review form for unauthenticated users', () => {
    // Visit as guest (no login)
    goToProduct();

    cy.get('[data-testid="review-login-prompt"]').should('be.visible');
    cy.get('[data-testid="review-login-prompt"]').should('contain', 'Log in');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

  // ─── TC4: Submitting a review with only a rating (no comment) ────────────
  it('TC4: should show validation errors when submitting with only a rating and no comment', () => {
    deleteJohnReviewViaApi();
    loginAsJohn();
    goToProduct();

    cy.get('[data-testid="review-form"]', { timeout: 10000 }).should('be.visible');
    // Select a rating but leave title and comment empty
    cy.get('[data-testid="review-star-3"]').click();
    cy.get('[data-testid="review-submit-button"]').click();

    // Should show validation errors for missing title and comment
    cy.get('[data-testid="review-title-error"]').should('be.visible');
    cy.get('[data-testid="review-comment-error"]').should('be.visible');
    cy.get('[data-testid="review-success"]').should('not.exist');
  });

  // ─── TC5: Submitting a review with only a comment (no rating) ────────────
  it('TC5: should show validation error when submitting with only a comment and no rating', () => {
    deleteJohnReviewViaApi();
    loginAsJohn();
    goToProduct();

    cy.get('[data-testid="review-form"]', { timeout: 10000 }).should('be.visible');
    // Fill title and comment but leave rating at 0
    cy.get('[data-testid="review-title-input"]').type('Good product');
    cy.get('[data-testid="review-comment-input"]').type('This product is quite good and I would recommend it to others.');
    cy.get('[data-testid="review-submit-button"]').click();

    // Should show validation error for missing rating
    cy.get('[data-testid="review-rating-error"]').should('be.visible');
    cy.get('[data-testid="review-rating-error"]').should('contain', 'Choose a rating');
    cy.get('[data-testid="review-success"]').should('not.exist');
  });

  // ─── TC6: Verifying the average rating updates after a new review ─────────
  it('TC6: should update the average rating after a new review is submitted', () => {
    deleteJohnReviewViaApi();
    loginAsJohn();
    goToProduct();

    cy.get('[data-testid="review-form"]', { timeout: 10000 }).should('be.visible');

    // Capture the current count before submitting
    cy.get('[data-testid="reviews-count"]').invoke('text').then((beforeCount) => {
      const prevNum = parseInt(String(beforeCount).match(/\d+/)?.[0] || '0', 10);

      cy.get('[data-testid="review-star-5"]').click();
      cy.get('[data-testid="review-title-input"]').type('Excellent quality');
      cy.get('[data-testid="review-comment-input"]').type('Absolutely love this product. The quality is outstanding and delivery was fast.');
      cy.get('[data-testid="review-submit-button"]').click();

      cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="reviews-average"]').should('be.visible');

      // Count should have increased — retryable assertion waits for DOM update
      cy.get('[data-testid="reviews-count"]').should(($el) => {
        const newNum = parseInt(($el.text().match(/\d+/) || ['0'])[0], 10);
        expect(newNum).to.be.greaterThan(prevNum);
      });
    });
  });

  // ─── TC7: Verifying review author name is displayed ──────────────────────
  it('TC7: should display the author name on each review', () => {
    // Visit as guest — product has known reviews with author names
    goToProduct();

    cy.get('[data-testid="review-item"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('[data-testid="review-item"]').each(($item) => {
      cy.wrap($item).find('[data-testid="review-item-author"]').should('be.visible');
      cy.wrap($item).find('[data-testid="review-item-author"]').invoke('text').should('have.length.greaterThan', 0);
    });
  });

  // ─── TC8: Verifying review date is displayed ──────────────────────────────
  it('TC8: should display the date on each review', () => {
    // Visit as guest — product has known reviews with dates
    goToProduct();

    cy.get('[data-testid="review-item"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('[data-testid="review-item"]').each(($item) => {
      // The date is rendered in the .meta div alongside the author name
      cy.wrap($item).find('.meta').should('be.visible');
      cy.wrap($item).find('.meta').invoke('text').should('match', /\d{4}|\w+ \d+/);
    });
  });

  // ─── TC9: Verifying star rating display on product cards/listing ──────────
  it('TC9: should display star rating on product cards in the product listing', () => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');

    // First product card should have a rating container
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="product-rating"]').should('be.visible');
      cy.get('[data-testid="review-count"]').should('be.visible');
    });

    // All cards should have a rating element
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="product-rating"]').should('exist');
    });
  });

  // ─── TC10: Attempting to submit a duplicate review for the same product ───
  it('TC10: should prevent submitting a duplicate review for the same product', () => {
    // Ensure john has a review by submitting one via API first
    cy.request({
      method: 'POST',
      url: `${BASE_URL}/api/auth/login`,
      body: { email: TEST_USER.email, password: TEST_USER.password },
      failOnStatusCode: false,
    }).then((loginResp) => {
      if (loginResp.status !== 200) return;
      const token = loginResp.body.data?.token || loginResp.body.token;

      // Check if john already has a review
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/products/${PRODUCT_ID}/reviews`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((reviewsResp) => {
        const reviews = reviewsResp.body?.reviews || [];
        const johnReview = reviews.find((r) => r.authorName && r.authorName.startsWith('John'));

        if (!johnReview) {
          // Submit a review via API
          cy.request({
            method: 'POST',
            url: `${BASE_URL}/api/products/${PRODUCT_ID}/reviews`,
            headers: { Authorization: `Bearer ${token}` },
            body: { rating: 3, title: 'My first review', comment: 'This is my initial review of this product. It is decent overall.' },
            failOnStatusCode: false,
          });
        }
      });
    });

    // Now visit the product page as john — should see "already reviewed"
    loginAsJohn();
    goToProduct();

    cy.get('[data-testid="already-reviewed"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="already-reviewed"]').should('contain', 'You have reviewed this product');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

});
