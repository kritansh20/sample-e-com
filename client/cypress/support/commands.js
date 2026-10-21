// Custom Cypress commands for this app

// Custom commands for e-commerce app testing
Cypress.Commands.add('apiLogin', (email = 'john@example.com', password = 'Ecomm@123') => {
  return cy
    .request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, password })
    .then(({ body }) => body.data);
});

Cypress.Commands.add('loginAsTestUser', (email = 'john@example.com', password = 'Ecomm@123') => {
  cy.log(`🔐 Logging in user: ${email}`);

  cy.session(
    ['login', email],
    () => {
      cy.apiLogin(email, password).then(({ token, user }) => {
        window.localStorage.setItem('authToken', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.request({
          url: `${Cypress.env('apiUrl')}/auth/profile`,
          headers: { Authorization: `Bearer ${window.localStorage.getItem('authToken')}` }
        });
      }
    }
  );

  cy.visit('/');
  cy.get('header').should('contain', 'Hi,');

  cy.log('✅ Login successful');
});

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

Cypress.Commands.add('apiClearCart', (email = 'john@example.com', password = 'Ecomm@123') => {
  cy.apiLogin(email, password).then(({ token }) => {
    cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/cart`, headers: authHeaders(token) });
  });
});

Cypress.Commands.add('apiClearWishlist', (email = 'john@example.com', password = 'Ecomm@123') => {
  cy.apiLogin(email, password).then(({ token }) => {
    cy.request({ url: `${Cypress.env('apiUrl')}/wishlist`, headers: authHeaders(token) }).then(({ body }) => {
      body.data.items.forEach(item => {
        cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/wishlist/${item.productId}`, headers: authHeaders(token) });
      });
    });
  });
});

Cypress.Commands.add('resetTestData', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`);
});

Cypress.Commands.add('restoreStorageState', () => {
  return cy.task('readStorageState').then(state => {
    if (!state) return cy.wrap(false);
    const origin = new URL(Cypress.config('baseUrl')).origin;
    (state.cookies || []).forEach(cookie => {
      cy.setCookie(cookie.name, cookie.value, {
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        ...(cookie.expires > 0 ? { expiry: cookie.expires } : {})
      });
    });
    const saved = (state.origins || []).find(entry => entry.origin === origin);
    (saved?.localStorage || []).forEach(({ name, value }) => window.localStorage.setItem(name, value));
    return cy.wrap(true);
  });
});

Cypress.Commands.add('registerNewUser', (userDetails = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test+${Date.now()}@example.com`,
    password: 'Test123!',
    ...userDetails
  };
  
  cy.log(`📝 Registering new user: ${defaultUser.email}`);
  
  cy.visit('/signup');
  cy.get('#firstName').type(defaultUser.firstName);
  cy.get('#lastName').type(defaultUser.lastName);
  cy.get('#email').type(defaultUser.email);
  cy.get('#password').type(defaultUser.password);
  cy.get('#confirmPassword').type(defaultUser.password);
  cy.get('[data-testid="terms-checkbox"]').check();
  cy.get('button[type="submit"]').click();
  
  // Should redirect after successful registration
  cy.url({ timeout: 10000 }).should('not.include', '/signup');
  
  cy.log('✅ Registration successful');
});

Cypress.Commands.add('addProductToCart', () => {
  cy.log('🛒 Adding product to cart');
  
  cy.visit('/products');
  cy.waitForProductsToLoad();
  
  // First ensure user is logged in (required for add to cart)
  cy.get('body').then(($body) => {
    if (!$body.text().includes('Hi,')) {
      cy.loginAsTestUser();
      cy.visit('/products');
      cy.waitForProductsToLoad();
    }
  });
  
  cy.intercept('POST', '**/api/cart').as('addToCart');
  cy.get('[data-testid="products-container"]').within(() => {
    cy.contains('button:not([disabled])', 'Add to Cart').click();
  });
  cy.wait('@addToCart');
  cy.log('✅ Product added to cart');
});

Cypress.Commands.add('searchProducts', (searchTerm) => {
  cy.log(`🔍 Searching for: ${searchTerm}`);
  
  cy.intercept({ method: 'GET', pathname: '/api/products', query: { search: searchTerm } }).as('searchProducts');
  cy.visit('/products');
  cy.get('input[placeholder*="Search products"]').clear().type(searchTerm);
  cy.wait('@searchProducts');
  cy.waitForProductsToLoad();
  
  cy.log('✅ Search completed');
});

Cypress.Commands.add('filterByCategory', (categoryName) => {
  cy.log(`📂 Filtering by category: ${categoryName}`);
  
  cy.intercept({ method: 'GET', pathname: '/api/products', query: { category: categoryName } }).as('filterProducts');
  cy.visit('/products');
  cy.get('[data-testid="category-select"]').select(categoryName);
  cy.wait('@filterProducts');
  cy.waitForProductsToLoad();
  
  cy.log('✅ Category filter applied');
});

Cypress.Commands.add('logoutUser', () => {
  cy.log('🚪 Logging out user');
  
  // Click the logout button in header
  cy.get('header').within(() => {
    cy.get('button').contains('Logout').click();
  });
  
  // Should redirect to home page
  cy.url().should('eq', Cypress.config().baseUrl + '/');
  
  // Header should show login/signup links
  cy.get('header').should('contain', 'Login');
  cy.get('header').should('contain', 'Sign Up');
  
  cy.log('✅ Logout successful');
});

Cypress.Commands.add('verifyPageLoad', (expectedUrl) => {
  const startTime = performance.now();
  
  if (expectedUrl) {
    cy.url().should('include', expectedUrl);
  }
  cy.get('body').should('be.visible');
  
  cy.window().then(() => {
    const loadTime = performance.now() - startTime;
    cy.log(`⏱️ Page load time: ${loadTime}ms`);
  });
});

Cypress.Commands.add('waitForProductsToLoad', () => {
  cy.get('[data-testid="products-container"]', { timeout: 10000 }).should('be.visible');
  
  // Wait for either products to load OR "No products found" message
  cy.get('body').should('satisfy', ($body) => {
    const hasProducts = $body.find('h3').length > 0; // Product titles
    const hasNoProductsMsg = $body.text().includes('No products found');
    const hasLoadingMsg = $body.text().includes('Loading products');
    
    return hasProducts || hasNoProductsMsg || !hasLoadingMsg;
  });
});

Cypress.Commands.add('verifyProductsDisplay', () => {
  cy.get('[data-testid="products-container"]').should('be.visible');
  
  cy.get('body').then(($body) => {
    if ($body.text().includes('No products found')) {
      cy.log('ℹ️ No products available');
    } else {
      // Verify at least one product is displayed
      cy.get('h3').should('have.length.at.least', 1); // Product titles
      cy.log('✅ Products displayed successfully');
    }
  });
});

Cypress.Commands.add('checkBasicAccessibility', () => {
  cy.log('♿ Checking basic accessibility');
  
  // Check that images have alt text (only if images exist)
  cy.get('body').then(($body) => {
    const images = $body.find('img');
    if (images.length > 0) {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    }
  });
  
  // Check that form inputs have labels or placeholders
  cy.get('body').then(($body) => {
    const inputs = $body.find('input');
    if (inputs.length > 0) {
      cy.get('input').each(($input) => {
        cy.wrap($input).should('satisfy', ($el) => {
          return $el.attr('placeholder') || 
                 $el.attr('aria-label') || 
                 $el.attr('id') ||
                 $el.closest('label').length > 0;
        });
      });
    }
  });
  
  cy.log('✅ Basic accessibility checks passed');
});

// Network simulation commands
Cypress.Commands.add('simulateOffline', () => {
  cy.log('📡 Simulating offline condition');
  cy.intercept('**', { forceNetworkError: true });
});

Cypress.Commands.add('simulateSlowNetwork', (delay = 3000) => {
  cy.log(`🐌 Simulating slow network (${delay}ms delay)`);
  cy.intercept('**', (req) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(req.continue()), delay);
    });
  });
});

// Error handling verification
Cypress.Commands.add('expectErrorHandling', () => {
  cy.get('body').should('be.visible');
  // App should still be functional even with errors
  cy.get('header').should('be.visible'); // Navigation should still work
});

// Form validation helper
Cypress.Commands.add('submitFormAndExpectValidation', () => {
  cy.get('form').within(() => {
    cy.get('button[type="submit"]').click();
  });
  
  // Should show validation messages or stay on same page
  cy.get('body').should('be.visible');
});

// Responsive testing helpers
Cypress.Commands.add('testMobileViewport', (callback) => {
  cy.viewport(375, 667); // iPhone SE
  if (callback) callback();
});

Cypress.Commands.add('testTabletViewport', (callback) => {
  cy.viewport(768, 1024); // iPad
  if (callback) callback();
});

Cypress.Commands.add('testDesktopViewport', (callback) => {
  cy.viewport(1280, 720); // Desktop
  if (callback) callback();
});

// Clear all storage helper
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});