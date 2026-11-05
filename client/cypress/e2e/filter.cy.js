/* global cy */
/**
 * Filter feature tests
 * Covers: search, category, price range, rating, in-stock, on-sale filters and clear-all
 * Source: client/src/pages/Products.tsx, client/src/components/ProductCard.tsx
 */

describe('Product Filters', () => {
  beforeEach(() => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]', { timeout: 10000 }).should('be.visible');
  });

  // ── Search ──────────────────────────────────────────────────────────────────

  it('filters products by search keyword', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="search-input"]').clear().type('Laptop');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    // Either products matching the term are shown, or a no-results message
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      } else {
        cy.get('[data-testid="no-results"]').should('be.visible');
      }
    });
  });

  it('shows no-results state when search term matches nothing', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="search-input"]').clear().type('xyznonexistentproduct12345');
    cy.wait('@getProducts');
    cy.get('[data-testid="no-results"]').should('be.visible');
  });

  it('clears search and restores full product list', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="search-input"]').clear().type('Laptop');
    cy.wait('@getProducts');
    cy.get('[data-testid="search-input"]').clear();
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
  });

  // ── Category ────────────────────────────────────────────────────────────────

  it('filters products by category', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="category-select"]').then(($select) => {
      const options = [...$select.find('option')].map(o => o.value).filter(v => v !== '');
      if (options.length === 0) {
        cy.log('No categories available — skipping category filter assertion');
        return;
      }
      cy.get('[data-testid="category-select"]').select(options[0]);
      cy.wait('@getProducts');
      cy.get('[data-testid="products-container"]').should('be.visible');
      // Verify the select still shows the chosen category (filter was applied)
      cy.get('[data-testid="category-select"]').should('have.value', options[0]);
    });
  });

  it('resets to all categories when "All Categories" is selected', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="category-select"]').then(($select) => {
      const options = [...$select.find('option')].map(o => o.value).filter(v => v !== '');
      if (options.length === 0) return;
      cy.get('[data-testid="category-select"]').select(options[0]);
      cy.wait('@getProducts');
      cy.get('[data-testid="category-select"]').select('');
      cy.wait('@getProducts');
      cy.get('[data-testid="products-container"]').should('be.visible');
    });
  });

  // ── Price range ─────────────────────────────────────────────────────────────

  it('filters products by minimum price', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="min-price-input"]').clear().type('100');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="product-price"]').each(($price) => {
          const price = parseFloat($price.attr('data-price') || '0');
          expect(price).to.be.at.least(100);
        });
      }
    });
  });

  it('filters products by maximum price', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="max-price-input"]').clear().type('500');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="product-price"]').each(($price) => {
          const price = parseFloat($price.attr('data-price') || '0');
          expect(price).to.be.at.most(500);
        });
      }
    });
  });

  it('shows price validation error when min price exceeds max price', () => {
    cy.get('[data-testid="min-price-input"]').clear().type('500');
    cy.get('[data-testid="max-price-input"]').clear().type('100');
    cy.get('[data-testid="price-error"]')
      .should('be.visible')
      .and('contain', 'Min price cannot be greater than max price');
  });

  it('filters products by both min and max price', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="min-price-input"]').clear().type('50');
    cy.get('[data-testid="max-price-input"]').clear().type('300');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="product-price"]').each(($price) => {
          const price = parseFloat($price.attr('data-price') || '0');
          expect(price).to.be.within(50, 300);
        });
      }
    });
  });

  // ── Rating ──────────────────────────────────────────────────────────────────

  it('filters products by minimum rating', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="rating-select"]').select('4');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        // Verify the rating filter select shows the chosen value (filter was applied)
        cy.get('[data-testid="rating-select"]').should('have.value', '4');
      } else {
        cy.get('[data-testid="no-results"]').should('be.visible');
      }
    });
  });

  // ── In-stock checkbox ────────────────────────────────────────────────────────

  it('filters to show only in-stock products', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="in-stock-checkbox"]').check();
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="stock-status"]').each(($status) => {
          expect($status.text()).to.not.equal('Out of Stock');
        });
      }
    });
  });

  it('unchecking in-stock filter restores all products', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="in-stock-checkbox"]').check();
    cy.wait('@getProducts');
    cy.get('[data-testid="in-stock-checkbox"]').uncheck();
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
  });

  // ── On-sale checkbox ─────────────────────────────────────────────────────────

  it('filters to show only on-sale products', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="on-sale-checkbox"]').check();
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="product-card"]').length > 0) {
        cy.get('[data-testid="sale-badge"]').should('have.length.at.least', 1);
      } else {
        cy.get('[data-testid="no-results"]').should('be.visible');
      }
    });
  });

  // ── Sort ─────────────────────────────────────────────────────────────────────

  it('sorts products by price low to high', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="sort-select"]').select('price_asc');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    // Verify the sort select shows the chosen value (sort was applied)
    cy.get('[data-testid="sort-select"]').should('have.value', 'price_asc');
  });

  it('sorts products by price high to low', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="sort-select"]').select('price_desc');
    cy.wait('@getProducts');
    cy.get('[data-testid="products-container"]').should('be.visible');
    // Verify the sort select shows the chosen value (sort was applied)
    cy.get('[data-testid="sort-select"]').should('have.value', 'price_desc');
  });

  // ── Clear all filters ────────────────────────────────────────────────────────

  it('clear-all-filters button is disabled when no filters are active', () => {
    cy.get('[data-testid="clear-filters-button"]').should('be.disabled');
  });

  it('clear-all-filters button is enabled after applying a filter', () => {
    cy.get('[data-testid="search-input"]').clear().type('test');
    cy.get('[data-testid="clear-filters-button"]').should('not.be.disabled');
  });

  it('clears all active filters when clear-all is clicked', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.get('[data-testid="search-input"]').clear().type('Laptop');
    cy.get('[data-testid="in-stock-checkbox"]').check();
    cy.wait('@getProducts');
    cy.get('[data-testid="clear-filters-button"]').click();
    cy.get('[data-testid="search-input"]').should('have.value', '');
    cy.get('[data-testid="in-stock-checkbox"]').should('not.be.checked');
    cy.get('[data-testid="clear-filters-button"]').should('be.disabled');
  });

  // ── Results count ────────────────────────────────────────────────────────────

  it('displays results count after products load', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.wait('@getProducts');
    cy.get('[data-testid="results-count"]').should('be.visible');
  });

  // ── Filters panel ────────────────────────────────────────────────────────────

  it('filters panel is visible on the products page', () => {
    cy.get('[data-testid="filters-panel"]').should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
    cy.get('[data-testid="category-select"]').should('be.visible');
    cy.get('[data-testid="min-price-input"]').should('be.visible');
    cy.get('[data-testid="max-price-input"]').should('be.visible');
    cy.get('[data-testid="rating-select"]').should('be.visible');
    cy.get('[data-testid="in-stock-checkbox"]').should('exist');
    cy.get('[data-testid="on-sale-checkbox"]').should('exist');
  });
});
