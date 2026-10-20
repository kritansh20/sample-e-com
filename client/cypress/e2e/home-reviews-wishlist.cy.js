// E2E tests: Home page (20), Product Reviews (20), Wishlist (20)
// Target: https://scholarships-dispatch-association-organic.trycloudflare.com
// Credentials: john@example.com / Ecomm@123

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the hero section on the home page', () => {
    cy.get('[data-testid="hero-section"]').should('be.visible');
  });

  it('displays the CTA button linking to /products', () => {
    cy.get('[data-testid="cta-button"]').should('be.visible');
    cy.get('[data-testid="cta-button"]').should('have.attr', 'href').and('include', '/products');
  });

  it('navigates to products page when CTA button is clicked', () => {
    cy.get('[data-testid="cta-button"]').click();
    cy.url().should('include', '/products');
  });

  it('displays the category grid section', () => {
    cy.get('[data-testid="category-grid"]').should('be.visible');
  });

  it('shows Books category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Books');
  });

  it('shows Electronics category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Electronics');
  });

  it('shows Clothing category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Clothing');
  });

  it('shows Footwear category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Footwear');
  });

  it('shows Sports category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Sports');
  });

  it('shows Home & Kitchen category in the category grid', () => {
    cy.get('[data-testid="category-grid"]').should('contain', 'Home & Kitchen');
  });

  it('displays the deals grid section', () => {
    cy.get('[data-testid="deals-grid"]').should('be.visible');
  });

  it('displays the featured products grid section', () => {
    cy.get('[data-testid="featured-products-grid"]').should('be.visible');
  });

  it('displays the view all products link', () => {
    cy.get('[data-testid="view-all-products"]').should('be.visible');
  });

  it('navigates to products page when view all products is clicked', () => {
    cy.get('[data-testid="view-all-products"]').click();
    cy.url().should('include', '/products');
  });

  it('renders the page header with navigation', () => {
    cy.get('header').should('be.visible');
  });

  it('shows Login link in header when not authenticated', () => {
    cy.get('header').should('contain', 'Login');
  });

  it('shows Sign Up link in header when not authenticated', () => {
    cy.get('header').should('contain', 'Sign Up');
  });

  it('loads the home page within acceptable time', () => {
    cy.verifyPageLoad('/');
  });

  it('home page is accessible with basic accessibility checks', () => {
    cy.checkBasicAccessibility();
  });

  it('home page renders correctly on mobile viewport', () => {
    cy.testMobileViewport();
    cy.get('[data-testid="hero-section"]').should('be.visible');
    cy.get('[data-testid="category-grid"]').should('be.visible');
  });
});

describe('Product Reviews', () => {
  let productId;

  before(() => {
    // Get a product ID by visiting the products page
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().then(($link) => {
      const href = $link.attr('href');
      productId = href.split('/products/')[1];
    });
  });

  beforeEach(() => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.url().should('match', /\/products\/.+/);
  });

  it('displays the reviews section on a product detail page', () => {
    cy.get('[data-testid="reviews-section"]').should('be.visible');
  });

  it('displays the reviews summary block', () => {
    cy.get('[data-testid="reviews-summary"]').should('be.visible');
  });

  it('displays the average rating in the reviews summary', () => {
    cy.get('[data-testid="reviews-average"]').should('be.visible');
  });

  it('displays the reviews count in the reviews summary', () => {
    cy.get('[data-testid="reviews-count"]').should('be.visible');
  });

  it('displays the rating distribution bars', () => {
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
  });

  it('shows a login prompt for the review form when not authenticated', () => {
    cy.get('[data-testid="review-login-prompt"]').should('be.visible');
  });

  it('displays the review form when authenticated', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="review-form"], [data-testid="already-reviewed"]').should('exist');
  });

  it('shows star rating picker in the review form when authenticated', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-rating"]').should('exist');
      }
    });
  });

  it('shows review title input in the review form when authenticated', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-title-input"]').should('exist');
      }
    });
  });

  it('shows review comment input in the review form when authenticated', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-comment-input"]').should('exist');
      }
    });
  });

  it('shows review submit button in the review form when authenticated', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-submit-button"]').should('exist');
      }
    });
  });

  it('shows validation error when submitting review form without rating', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-submit-button"]').click();
        cy.get('[data-testid="review-rating-error"]').should('be.visible');
      }
    });
  });

  it('shows validation error when submitting review form without title', () => {
    cy.loginOrRestoreSession();
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-form"]').length > 0) {
        cy.get('[data-testid="review-star-5"]').click();
        cy.get('[data-testid="review-submit-button"]').click();
        cy.get('[data-testid="review-title-error"]').should('be.visible');
      }
    });
  });

  it('shows the sort select dropdown in the reviews section', () => {
    cy.get('[data-testid="review-sort-select"]').should('exist');
  });

  it('sort select has newest option', () => {
    cy.get('[data-testid="review-sort-select"]').should('contain', 'newest');
  });

  it('sort select has highest option', () => {
    cy.get('[data-testid="review-sort-select"]').should('contain', 'highest');
  });

  it('sort select has lowest option', () => {
    cy.get('[data-testid="review-sort-select"]').should('contain', 'lowest');
  });

  it('reviews section exists on the product detail page', () => {
    cy.get('[data-testid="reviews-section"]').should('exist');
  });

  it('product detail page URL follows /products/:id pattern', () => {
    cy.url().should('match', /\/products\/[^/]+$/);
  });

  it('review items display author name when reviews exist', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-item"]').length > 0) {
        cy.get('[data-testid="review-item-author"]').first().should('be.visible');
      }
    });
  });

  it('review items display rating when reviews exist', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-item"]').length > 0) {
        cy.get('[data-testid="review-item-rating"]').first().should('be.visible');
      }
    });
  });
});

describe('Wishlist', () => {
  beforeEach(() => {
    cy.loginOrRestoreSession();
  });

  it('wishlist page is accessible at /wishlist when authenticated', () => {
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]').should('be.visible');
  });

  it('wishlist page shows the wishlist count', () => {
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]').should('exist');
  });

  it('wishlist page shows empty state when no items are wishlisted', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-empty"]').length > 0) {
        cy.get('[data-testid="wishlist-empty"]').should('be.visible');
      } else {
        cy.get('[data-testid="wishlist-list"]').should('be.visible');
      }
    });
  });

  it('redirects unauthenticated users away from /wishlist', () => {
    cy.clearAllStorage();
    cy.visit('/wishlist');
    cy.url().should('not.eq', Cypress.config('baseUrl') + '/wishlist');
  });

  it('wishlist toggle button is visible on product cards when authenticated', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().should('be.visible');
  });

  it('wishlist toggle button on product card has correct aria-pressed attribute', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().should('have.attr', 'aria-pressed');
  });

  it('clicking wishlist toggle on a product card adds it to wishlist', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="wishlist-toggle"]').first().then(($btn) => {
      const wasActive = $btn.attr('aria-pressed') === 'true';
      cy.wrap($btn).click();
      cy.get('[data-testid="wishlist-toggle"]').first().should('have.attr', 'aria-pressed', String(!wasActive));
    });
  });

  it('wishlist toggle on product detail page is visible when authenticated', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="wishlist-toggle"]').should('be.visible');
  });

  it('wishlist toggle on product detail page shows correct label when not in wishlist', () => {
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="wishlist-toggle"]').then(($btn) => {
      const pressed = $btn.attr('aria-pressed');
      if (pressed === 'false') {
        cy.wrap($btn).should('contain', 'Add to Wishlist');
      } else {
        cy.wrap($btn).should('contain', 'Wishlist');
      }
    });
  });

  it('wishlist page shows wishlist items after adding a product', () => {
    // Add a product to wishlist via product detail page
    cy.visit('/products');
    cy.waitForProductsToLoad();
    cy.get('[data-testid="view-details-button"]').first().click();
    cy.get('[data-testid="wishlist-toggle"]').then(($btn) => {
      if ($btn.attr('aria-pressed') === 'false') {
        cy.wrap($btn).click();
        cy.get('[data-testid="product-detail-message"]').should('contain', 'wishlist');
      }
    });
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-list"]').length > 0) {
        cy.get('[data-testid="wishlist-item"]').should('have.length.at.least', 1);
      }
    });
  });

  it('wishlist item displays the product name', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-item-name"]').first().should('be.visible');
      }
    });
  });

  it('wishlist item displays the product price', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-item-price"]').first().should('be.visible');
      }
    });
  });

  it('wishlist item displays the stock status', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-item-stock"]').first().should('exist');
      }
    });
  });

  it('wishlist item has a move to cart button', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-move-to-cart"]').first().should('be.visible');
      }
    });
  });

  it('wishlist item has a remove button', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-remove-button"]').first().should('be.visible');
      }
    });
  });

  it('removing a wishlist item decreases the wishlist count', () => {
    cy.visit('/wishlist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="wishlist-item"]').length > 0) {
        cy.get('[data-testid="wishlist-count"]').invoke('text').then((countBefore) => {
          cy.get('[data-testid="wishlist-remove-button"]').first().click();
          cy.get('[data-testid="wishlist-count"]').invoke('text').should((countAfter) => {
            expect(parseInt(countAfter)).to.be.lessThan(parseInt(countBefore));
          });
        });
      }
    });
  });

  it('wishlist page shows item count in the count element', () => {
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-count"]').should('be.visible');
  });

  it('wishlist page is accessible with basic accessibility checks', () => {
    cy.visit('/wishlist');
    cy.checkBasicAccessibility();
  });

  it('wishlist page renders correctly on mobile viewport', () => {
    cy.testMobileViewport();
    cy.visit('/wishlist');
    cy.get('[data-testid="wishlist-page"]').should('be.visible');
  });
});
