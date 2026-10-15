/**
 * Product Reviews – 10 Cypress e2e tests
 * Target: http://localhost:5005
 * Component: client/src/components/ProductReviews.tsx
 */

const TEST_USER = Cypress.env('testUser') || { email: 'john@example.com', password: 'Ecomm@123' };
const API = Cypress.env('apiUrl') || 'http://localhost:5010/api';

// Helper: log in via API and return auth token + user id
function apiLogin() {
  return cy.request('POST', `${API}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password,
  }).then((res) => {
    // Response shape: {success, data: {token, user}} or {token, user}
    const body = res.body;
    return body.data || body;
  });
}

// Helper: get the first product id via API
function getFirstProductId() {
  return cy.request(`${API}/products`).then((res) => {
    // Response shape: {success, data: {data: [...], total, page}}
    const body = res.body;
    const products = (body.data && body.data.data) || body.data || body.products || body;
    return Array.isArray(products) ? products[0].id : products;
  });
}

// Helper: delete the test user's review on a product via API (if it exists)
// userId comes from the login response (data.user.id)
function deleteOwnReviewViaApi(productId, token, userId) {
  return cy.request({
    method: 'GET',
    url: `${API}/products/${productId}/reviews`,
    failOnStatusCode: false,
  }).then((res) => {
    // Shape: {success, data: {reviews: [...], summary}}
    const reviews = (res.body.data && res.body.data.reviews) || res.body.reviews || [];
    const ownReview = reviews.find((r) => r.userId === userId);
    if (ownReview) {
      return cy.request({
        method: 'DELETE',
        url: `${API}/products/${productId}/reviews/${ownReview.id}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }
  });
}

// Helper: log in via UI
function loginAsUser() {
  cy.visit('/login');
  cy.get('#email').clear().type(TEST_USER.email);
  cy.get('#password').clear().type(TEST_USER.password);
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.get('header', { timeout: 10000 }).should('contain', 'Hi,');
}

// Helper: visit a product detail page by id
function visitProduct(productId) {
  cy.visit(`/products/${productId}`);
  cy.get('[data-testid="reviews-section"]', { timeout: 15000 }).should('be.visible');
}

// Helper: ensure the review form is visible (no existing review)
function ensureFormVisible() {
  cy.get('[data-testid="review-form"]', { timeout: 10000 }).should('be.visible');
}

describe('Product Reviews', () => {
  // ── Test 1 ──────────────────────────────────────────────────────────────────
  it('(1) reviews section is visible on the product detail page', () => {
    getFirstProductId().then((productId) => {
      cy.clearCookies();
      cy.clearLocalStorage();
      visitProduct(productId);
      cy.get('[data-testid="reviews-section"]').should('be.visible');
      cy.get('[data-testid="review-sort-select"]').should('exist');
    });
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('(2) unauthenticated user sees login prompt instead of review form', () => {
    getFirstProductId().then((productId) => {
      cy.clearCookies();
      cy.clearLocalStorage();
      visitProduct(productId);
      cy.get('[data-testid="review-login-prompt"]').should('be.visible');
      cy.get('[data-testid="review-form"]').should('not.exist');
    });
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('(3) authenticated user sees the review form', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          cy.get('[data-testid="review-rating"]').should('be.visible');
          cy.get('[data-testid="review-title-input"]').should('be.visible');
          cy.get('[data-testid="review-comment-input"]').should('be.visible');
          cy.get('[data-testid="review-submit-button"]').should('be.visible');
        });
      });
    });
  });

  // ── Test 4 ──────────────────────────────────────────────────────────────────
  it('(4) submitting with no rating shows validation error', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          // Fill title and comment but leave rating at 0
          cy.get('[data-testid="review-title-input"]').type('Good product');
          cy.get('[data-testid="review-comment-input"]').type('This is a detailed review comment.');
          cy.get('[data-testid="review-submit-button"]').click();
          cy.get('[data-testid="review-rating-error"]').should('be.visible')
            .and('contain', 'rating');
        });
      });
    });
  });

  // ── Test 5 ──────────────────────────────────────────────────────────────────
  it('(5) submitting with short title shows validation error', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          cy.get('[data-testid="review-star-4"]').click();
          cy.get('[data-testid="review-title-input"]').type('Hi'); // too short (< 3 chars)
          cy.get('[data-testid="review-comment-input"]').type('This is a detailed review comment.');
          cy.get('[data-testid="review-submit-button"]').click();
          cy.get('[data-testid="review-title-error"]').should('be.visible')
            .and('contain', 'Title');
        });
      });
    });
  });

  // ── Test 6 ──────────────────────────────────────────────────────────────────
  it('(6) submitting with short comment shows validation error', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          cy.get('[data-testid="review-star-3"]').click();
          cy.get('[data-testid="review-title-input"]').type('Good product');
          cy.get('[data-testid="review-comment-input"]').type('Short'); // too short (< 10 chars)
          cy.get('[data-testid="review-submit-button"]').click();
          cy.get('[data-testid="review-comment-error"]').should('be.visible')
            .and('contain', 'Review');
        });
      });
    });
  });

  // ── Test 7 ──────────────────────────────────────────────────────────────────
  it('(7) valid review submission succeeds and shows success message', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          cy.get('[data-testid="review-star-5"]').click();
          cy.get('[data-testid="review-title-input"]').type('Excellent product');
          cy.get('[data-testid="review-comment-input"]').type('This product exceeded all my expectations. Highly recommended!');
          cy.get('[data-testid="review-submit-button"]').click();
          cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('be.visible')
            .and('contain', 'Thanks');
        });
      });
    });
  });

  // ── Test 8 ──────────────────────────────────────────────────────────────────
  it('(8) submitted review appears in the review list', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          loginAsUser();
          visitProduct(productId);
          ensureFormVisible();
          const reviewTitle = 'My test review title';
          cy.get('[data-testid="review-star-4"]').click();
          cy.get('[data-testid="review-title-input"]').type(reviewTitle);
          cy.get('[data-testid="review-comment-input"]').type('A thorough and detailed review comment for testing purposes.');
          cy.get('[data-testid="review-submit-button"]').click();
          cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('be.visible');
          cy.get('[data-testid="review-list"]').should('be.visible');
          cy.get('[data-testid="review-item"]').should('have.length.at.least', 1);
          cy.get('[data-testid="review-item-title"]').should('contain', reviewTitle);
        });
      });
    });
  });

  // ── Test 9 ──────────────────────────────────────────────────────────────────
  it('(9) user can delete their own review', () => {
    apiLogin().then(({ token, user }) => {
      getFirstProductId().then((productId) => {
        // Ensure a review exists: delete any old one, then create a fresh one via API
        deleteOwnReviewViaApi(productId, token, user.id).then(() => {
          cy.request({
            method: 'POST',
            url: `${API}/products/${productId}/reviews`,
            headers: { Authorization: `Bearer ${token}` },
            body: { rating: 3, title: 'Review to delete', comment: 'This review will be deleted in the test.' },
          }).then(() => {
            loginAsUser();
            visitProduct(productId);
            cy.get('[data-testid="delete-review-button"]', { timeout: 10000 }).first().click();
            cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('be.visible')
              .and('contain', 'deleted');
            cy.get('[data-testid="review-form"]', { timeout: 8000 }).should('be.visible');
          });
        });
      });
    });
  });

  // ── Test 10 ─────────────────────────────────────────────────────────────────
  it('(10) sort dropdown changes review order', () => {
    getFirstProductId().then((productId) => {
      cy.clearCookies();
      cy.clearLocalStorage();
      visitProduct(productId);
      cy.get('[data-testid="review-sort-select"]').should('have.value', 'newest');

      cy.get('[data-testid="review-sort-select"]').select('highest');
      cy.get('[data-testid="review-sort-select"]').should('have.value', 'highest');
      cy.get('[data-testid="review-list"]').should('be.visible');

      cy.get('[data-testid="review-sort-select"]').select('lowest');
      cy.get('[data-testid="review-sort-select"]').should('have.value', 'lowest');
      cy.get('[data-testid="review-list"]').should('be.visible');

      cy.get('[data-testid="review-sort-select"]').select('newest');
      cy.get('[data-testid="review-sort-select"]').should('have.value', 'newest');
    });
  });
});
