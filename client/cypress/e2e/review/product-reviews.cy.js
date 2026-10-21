/**
 * Product Reviews – 10 Cypress e2e tests
 * Target: https://gcc-habits-lone-edge.trycloudflare.com
 */

const REVIEW_TITLE = 'Great product for testing';
const REVIEW_COMMENT = 'This is a detailed review comment used for automated testing purposes.';

/** Navigate to the first product detail page and alias its id */
function visitFirstProduct() {
  cy.intercept('GET', '**/api/products*').as('getProducts');
  cy.visit('/products');
  cy.wait('@getProducts');
  cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
  // Click the first product card link
  cy.get('[data-testid="products-container"]').find('a').first().click();
  cy.url().should('match', /\/products\/\w+/);
  cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
}

/** Delete any existing review by the test user via API so the form is shown */
function deleteOwnReviewIfExists() {
  cy.window().then(win => {
    const token = win.localStorage.getItem('authToken');
    if (!token) return;
    cy.url().then(url => {
      const productId = url.split('/products/')[1]?.split('?')[0];
      if (!productId) return;
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/products/${productId}/reviews`,
        failOnStatusCode: false
      }).then(res => {
        const user = JSON.parse(win.localStorage.getItem('user') || '{}');
        const own = res.body?.data?.reviews?.find(r => r.userId === user.id);
        if (own) {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/products/${productId}/reviews/${own.id}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
          });
        }
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Product Reviews', () => {

  // ── Test 1 ──────────────────────────────────────────────────────────────────
  it('(1) reviews section is visible on product detail page', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    cy.get('[data-testid="reviews-section"]').should('be.visible');
    cy.get('[data-testid="reviews-section"]').should('contain.text', 'Customer Reviews');
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('(2) star rating display is shown in the reviews summary', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    // The summary block always renders once data loads
    cy.get('[data-testid="reviews-summary"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="reviews-average"]').should('be.visible');
    // Rating distribution bars (5★ through 1★) are rendered
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
    cy.get('[data-testid="rating-bar-5"]').should('exist');
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('(3) review count is shown in the reviews summary', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    cy.get('[data-testid="reviews-count"]', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .should('match', /\d+\s+review/);
  });

  // ── Test 4 ──────────────────────────────────────────────────────────────────
  it('(4) logged-in user can submit a review with rating and comment', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    deleteOwnReviewIfExists();
    cy.reload();
    cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');

    // The form should be visible (user has no review yet)
    cy.get('[data-testid="review-form"]', { timeout: 15000 }).should('be.visible');

    // Pick 4 stars
    cy.get('[data-testid="review-star-4"]').click();
    cy.get('[data-testid="review-title-input"]').type(REVIEW_TITLE);
    cy.get('[data-testid="review-comment-input"]').type(REVIEW_COMMENT);

    cy.intercept('POST', '**/reviews').as('postReview');
    cy.get('[data-testid="review-submit-button"]').click();
    cy.wait('@postReview').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.get('[data-testid="review-success"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain.text', 'review has been posted');
  });

  // ── Test 5 ──────────────────────────────────────────────────────────────────
  it('(5) review form validation blocks empty submission', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    deleteOwnReviewIfExists();
    cy.reload();
    cy.get('[data-testid="review-form"]', { timeout: 15000 }).should('be.visible');

    // Submit without filling anything
    cy.get('[data-testid="review-submit-button"]').click();

    // Validation errors should appear
    cy.get('[data-testid="review-rating-error"]').should('be.visible');
    cy.get('[data-testid="review-title-error"]').should('be.visible');
    cy.get('[data-testid="review-comment-error"]').should('be.visible');

    // Form should still be present (not submitted)
    cy.get('[data-testid="review-form"]').should('be.visible');
  });

  // ── Test 6 ──────────────────────────────────────────────────────────────────
  it('(6) submitted review appears in the review list', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    deleteOwnReviewIfExists();
    cy.reload();
    cy.get('[data-testid="review-form"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="review-star-5"]').click();
    cy.get('[data-testid="review-title-input"]').type(REVIEW_TITLE);
    cy.get('[data-testid="review-comment-input"]').type(REVIEW_COMMENT);

    cy.intercept('POST', '**/reviews').as('postReview');
    cy.get('[data-testid="review-submit-button"]').click();
    cy.wait('@postReview');

    cy.get('[data-testid="review-list"]', { timeout: 15000 })
      .find('[data-testid="review-item"]')
      .should('have.length.at.least', 1);

    cy.get('[data-testid="review-list"]').should('contain.text', REVIEW_TITLE);
    cy.get('[data-testid="review-list"]').should('contain.text', REVIEW_COMMENT);
  });

  // ── Test 7 ──────────────────────────────────────────────────────────────────
  it('(7) review author name is displayed on each review item', () => {
    cy.loginAsTestUser();
    visitFirstProduct();
    // Ensure at least one review exists by submitting if needed
    cy.get('[data-testid="review-list"]', { timeout: 15000 }).then($list => {
      if ($list.find('[data-testid="review-item"]').length === 0) {
        // Submit a review first
        cy.get('body').then($body => {
          if ($body.find('[data-testid="review-form"]').length) {
            cy.get('[data-testid="review-star-3"]').click();
            cy.get('[data-testid="review-title-input"]').type(REVIEW_TITLE);
            cy.get('[data-testid="review-comment-input"]').type(REVIEW_COMMENT);
            cy.get('[data-testid="review-submit-button"]').click();
            cy.get('[data-testid="review-success"]', { timeout: 15000 }).should('be.visible');
          }
        });
      }
    });

    cy.get('[data-testid="review-list"]')
      .find('[data-testid="review-item"]')
      .first()
      .find('[data-testid="review-item-author"]')
      .should('be.visible')
      .invoke('text')
      .should('have.length.at.least', 1);
  });

  // ── Test 8 ──────────────────────────────────────────────────────────────────
  it('(8) review date is displayed on each review item', () => {
    cy.loginAsTestUser();
    visitFirstProduct();

    cy.get('[data-testid="review-list"]', { timeout: 15000 }).then($list => {
      if ($list.find('[data-testid="review-item"]').length === 0) {
        cy.get('body').then($body => {
          if ($body.find('[data-testid="review-form"]').length) {
            cy.get('[data-testid="review-star-3"]').click();
            cy.get('[data-testid="review-title-input"]').type(REVIEW_TITLE);
            cy.get('[data-testid="review-comment-input"]').type(REVIEW_COMMENT);
            cy.get('[data-testid="review-submit-button"]').click();
            cy.get('[data-testid="review-success"]', { timeout: 15000 }).should('be.visible');
          }
        });
      }
    });

    // The date is rendered inline in the .meta div alongside the author name
    cy.get('[data-testid="review-list"]')
      .find('[data-testid="review-item"]')
      .first()
      .find('.meta')
      .should('be.visible')
      .invoke('text')
      // formatDate produces something like "Jan 1, 2024" or similar
      .should('match', /\w+\s+\d+,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/);
  });

  // ── Test 9 ──────────────────────────────────────────────────────────────────
  it('(9) unauthenticated user cannot submit a review — login prompt shown', () => {
    // Visit without logging in
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="products-container"]').find('a').first().click();
    cy.url().should('match', /\/products\/\w+/);
    cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');

    // Review form must NOT be present
    cy.get('[data-testid="review-form"]').should('not.exist');

    // Login prompt must be visible
    cy.get('[data-testid="review-login-prompt"]')
      .should('be.visible')
      .and('contain.text', 'Log in');
  });

  // ── Test 10 ─────────────────────────────────────────────────────────────────
  it('(10) reviews persist after page reload', () => {
    cy.loginAsTestUser();
    visitFirstProduct();

    // Capture the current review count before reload
    cy.get('[data-testid="reviews-count"]', { timeout: 15000 })
      .invoke('text')
      .then(countBefore => {
        cy.reload();
        cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
        cy.get('[data-testid="reviews-count"]', { timeout: 15000 })
          .invoke('text')
          .should('eq', countBefore);
      });

    // Review list items should still be present after reload
    cy.get('[data-testid="review-list"]').should('be.visible');
  });

});
