// Product Reviews E2E Tests
describe('Product Reviews', () => {
  const BASE_PRODUCT_URL = '/products';

  // Helper: navigate to first product detail page
  const goToFirstProduct = () => {
    cy.visit(BASE_PRODUCT_URL);
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="reviews-section"]', { timeout: 10000 }).should('be.visible');
  };

  // 1. Reviews section is visible on product detail page
  it('displays the reviews section on a product detail page', () => {
    cy.visit(BASE_PRODUCT_URL);
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="reviews-section"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="reviews-section"]').should('contain', 'Customer Reviews');
  });

  // 2. Unauthenticated user sees login prompt instead of review form
  it('shows login prompt for unauthenticated users instead of review form', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-login-prompt"]').should('be.visible');
    cy.get('[data-testid="review-form"]').should('not.exist');
  });

  // 3. Reviews summary (count + average) is displayed
  it('displays reviews summary with count and average rating', () => {
    goToFirstProduct();
    cy.get('[data-testid="reviews-summary"]').should('be.visible');
    cy.get('[data-testid="reviews-count"]').should('be.visible');
    cy.get('[data-testid="reviews-average"]').should('be.visible');
  });

  // 4. Rating distribution bars are rendered
  it('renders rating distribution bars for all 5 star levels', () => {
    goToFirstProduct();
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
    ['5', '4', '3', '2', '1'].forEach(star => {
      cy.get(`[data-testid="rating-bar-${star}"]`).should('exist');
    });
  });

  // 5. Sort dropdown is present and has expected options
  it('shows sort dropdown with Newest, Highest rated, Lowest rated options', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-sort-select"]').should('be.visible');
    cy.get('[data-testid="review-sort-select"] option').should('have.length', 3);
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Newest');
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Highest rated');
    cy.get('[data-testid="review-sort-select"]').should('contain', 'Lowest rated');
  });

  // 6. Authenticated user sees the review form
  it('shows review form for authenticated users', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    // Either the form is shown or the "already reviewed" message
    cy.get('body').then($body => {
      if ($body.find('[data-testid="already-reviewed"]').length > 0) {
        cy.get('[data-testid="already-reviewed"]').should('be.visible');
      } else {
        cy.get('[data-testid="review-form"]').should('be.visible');
        cy.get('[data-testid="review-rating"]').should('be.visible');
        cy.get('[data-testid="review-title-input"]').should('be.visible');
        cy.get('[data-testid="review-comment-input"]').should('be.visible');
        cy.get('[data-testid="review-submit-button"]').should('be.visible');
      }
    });
  });

  // 7. Review form shows validation errors when submitted empty
  it('shows validation errors when review form is submitted without data', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length === 0) {
        // Already reviewed — skip form validation test
        cy.log('User already reviewed this product; skipping form validation');
        return;
      }
      cy.get('[data-testid="review-submit-button"]').click();
      cy.get('[data-testid="review-rating-error"]').should('be.visible');
    });
  });

  // 8. Star picker buttons are interactive
  it('allows selecting a star rating via the star picker', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length === 0) {
        cy.log('User already reviewed; skipping star picker test');
        return;
      }
      cy.get('[data-testid="review-star-4"]').click();
      cy.get('[data-testid="review-star-4"]').should('have.attr', 'aria-checked', 'true');
    });
  });

  // 9. Character counter updates as user types in comment field
  it('updates character counter as user types in the comment field', () => {
    cy.loginAsTestUser();
    goToFirstProduct();
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-form"]').length === 0) {
        cy.log('User already reviewed; skipping character counter test');
        return;
      }
      const text = 'This is a test comment';
      cy.get('[data-testid="review-comment-input"]').type(text);
      cy.get('[data-testid="review-comment-count"]').should('contain', `${text.length}/1000`);
    });
  });

  // 10. Review list container is rendered (empty state or reviews)
  it('renders the review list container with reviews or empty state message', () => {
    goToFirstProduct();
    cy.get('[data-testid="review-list"]').should('exist');
    // Wait for the async data to settle, then branch
    cy.wait(2000);
    cy.get('body').then($body => {
      if ($body.find('[data-testid="review-item"]').length > 0) {
        cy.get('[data-testid="review-item"]').first().within(() => {
          cy.get('[data-testid="review-item-title"]').should('be.visible');
          cy.get('[data-testid="review-item-author"]').should('be.visible');
          cy.get('[data-testid="review-item-comment"]').should('be.visible');
        });
      } else {
        cy.get('[data-testid="no-reviews"]').should('be.visible');
      }
    });
  });
});
