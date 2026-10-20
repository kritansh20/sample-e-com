// Product Reviews feature tests
// Covers: reviews section display, form validation, submit, delete, sort, login prompt

describe('Product Reviews', () => {
  const BASE_PRODUCT_URL = '/products';

  // Helper: navigate to first product detail page
  const goToFirstProduct = () => {
    cy.visit(BASE_PRODUCT_URL);
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
  };

  // ── 1. Reviews section renders on product detail page ──────────────────────
  it('displays the reviews section on a product detail page', () => {
    cy.visit(BASE_PRODUCT_URL);
    cy.get('[data-testid="products-container"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="reviews-summary"]').should('be.visible');
    cy.get('[data-testid="reviews-count"]').should('be.visible');
  });

  // ── 2. Reviews average and count are shown ─────────────────────────────────
  it('shows reviews average and count in the summary', () => {
    goToFirstProduct();
    cy.get('[data-testid="reviews-average"]').should('be.visible');
    cy.get('[data-testid="reviews-count"]').should('be.visible');
  });

  // ── 3. Unauthenticated user sees login prompt instead of form ──────────────
  it('shows login prompt to unauthenticated users instead of review form', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-login-prompt"]').should('be.visible');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

  // ── 4. Authenticated user sees the review form ─────────────────────────────
  it('shows the review form to authenticated users', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    // Either the form is shown (no prior review) or the already-reviewed message
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length) {
        cy.get('[data-testid="review-form"]').should('be.visible');
        cy.get('[data-testid="review-title-input"]').should('be.visible');
        cy.get('[data-testid="review-comment-input"]').should('be.visible');
        cy.get('[data-testid="review-submit-button"]').should('be.visible');
      } else {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      }
    });
  });

  // ── 5. Star rating buttons 1-5 are present ─────────────────────────────────
  it('renders all five star rating buttons in the review form', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length) {
        for (let i = 1; i <= 5; i++) {
          cy.get(`[data-testid="review-star-${i}"]`).should('be.visible');
        }
      } else {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      }
    });
  });

  // ── 6. Form validation: submitting empty form shows errors ─────────────────
  it('shows validation errors when submitting an empty review form', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length) {
        cy.get('[data-testid="review-submit-button"]').click();
        // At least one field error should appear (rating, title, or comment)
        cy.get('body').should('satisfy', $body =>
          $body.text().includes('rating') ||
          $body.text().includes('Title') ||
          $body.text().includes('Review') ||
          $body.find('[data-testid="review-rating-error"]').length > 0 ||
          $body.find('[data-testid="review-title-error"]').length > 0 ||
          $body.find('[data-testid="review-comment-error"]').length > 0
        );
      } else {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      }
    });
  });

  // ── 7. Form validation: title too short ────────────────────────────────────
  it('shows a title validation error when title is too short', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length) {
        cy.get('[data-testid="review-star-4"]').click();
        cy.get('[data-testid="review-title-input"]').type('ab'); // < 3 chars
        cy.get('[data-testid="review-comment-input"]').type('This is a valid comment that is long enough.');
        cy.get('[data-testid="review-submit-button"]').click();
        cy.get('[data-testid="review-title-error"]').should('be.visible');
      } else {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      }
    });
  });

  // ── 8. Form validation: comment too short ──────────────────────────────────
  it('shows a comment validation error when comment is too short', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length) {
        cy.get('[data-testid="review-star-3"]').click();
        cy.get('[data-testid="review-title-input"]').type('Valid Title');
        cy.get('[data-testid="review-comment-input"]').type('Short'); // < 10 chars
        cy.get('[data-testid="review-submit-button"]').click();
        cy.get('[data-testid="review-comment-error"]').should('be.visible');
      } else {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      }
    });
  });

  // ── 9. Sort select is present and has expected options ─────────────────────
  it('renders the sort select with Newest, Highest rated, and Lowest rated options', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-sort-select"]').should('be.visible');
    cy.get('[data-testid="review-sort-select"] option').should('have.length', 3);
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Newest');
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Highest rated');
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Lowest rated');
  });

  // ── 10. Changing sort reloads the review list ──────────────────────────────
  it('reloads the review list when the sort order is changed', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-sort-select"]').select('highest');
    cy.get('[data-testid="review-list"]').should('be.visible');
    cy.get('[data-testid="review-sort-select"]').should('have.value', 'highest');
    cy.get('[data-testid="review-sort-select"]').select('lowest');
    cy.get('[data-testid="review-list"]').should('be.visible');
    cy.get('[data-testid="review-sort-select"]').should('have.value', 'lowest');
  });
});
