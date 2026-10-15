import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Product, ProductsResponse } from '../types';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { ProductCard } from '../components/ProductCard';
import { Alert, EmptyState, Page, PageTitle } from '../components/ui';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name: A to Z' },
];

const Layout = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 30px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: fit-content;

  h2 {
    font-size: 1.1rem;
    margin-bottom: 16px;
  }
`;

const PriceRow = styled.div`
  display: flex;
  gap: 8px;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  cursor: pointer;

  input {
    width: auto;
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  select {
    width: auto;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
`;

const Pagination = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 8px 14px;
  border: 1px solid #ddd;
  background-color: ${p => (p.$active ? '#007bff' : 'white')};
  color: ${p => (p.$active ? 'white' : '#333')};
`;

const numberParam = (value: string | null) => (value === null || value === '' ? undefined : Number(value));

const Products: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const search = params.get('q') || '';
  const category = params.get('category') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const minRating = params.get('minRating') || '';
  const inStock = params.get('inStock') === '1';
  const onSale = params.get('onSale') === '1';
  const sort = params.get('sort') || 'relevance';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const priceError =
    minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)
      ? 'Min price cannot be greater than max price'
      : null;

  const updateParams = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    apiClient.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (priceError) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    apiClient
      .getProducts({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        category: category || undefined,
        minPrice: numberParam(minPrice),
        maxPrice: numberParam(maxPrice),
        minRating: numberParam(minRating),
        inStock: inStock || undefined,
        onSale: onSale || undefined,
        sort,
      })
      .then(result => {
        if (id === requestId.current) setProducts(result);
      })
      .catch(err => {
        if (id === requestId.current) setError(getErrorMessage(err, 'Failed to load products'));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [page, search, category, minPrice, maxPrice, minRating, inStock, onSale, sort, priceError]);

  const hasFilters = Boolean(search || category || minPrice || maxPrice || minRating || inStock || onSale || sort !== 'relevance');
  const pagination = products?.data.pagination;
  const list = products?.data.data || [];
  const from = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <Page role="main" data-testid="products-container">
      <PageTitle>Products</PageTitle>
      <Layout>
        <Sidebar aria-label="Filters" data-testid="filters-panel">
          <h2>Filters</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Search products..."
              value={search}
              data-testid="search-input"
              onChange={e => updateParams({ q: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select id="category" value={category} data-testid="category-select" onChange={e => updateParams({ category: e.target.value })}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <span className="form-label">Price ($)</span>
            <PriceRow>
              <input
                type="number"
                min={0}
                placeholder="Min"
                aria-label="Minimum price"
                value={minPrice}
                data-testid="min-price-input"
                onChange={e => updateParams({ minPrice: e.target.value })}
              />
              <input
                type="number"
                min={0}
                placeholder="Max"
                aria-label="Maximum price"
                value={maxPrice}
                data-testid="max-price-input"
                onChange={e => updateParams({ maxPrice: e.target.value })}
              />
            </PriceRow>
            {priceError && <div className="error-message" role="alert" data-testid="price-error">{priceError}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="minRating">Customer rating</label>
            <select id="minRating" value={minRating} data-testid="rating-select" onChange={e => updateParams({ minRating: e.target.value })}>
              <option value="">Any rating</option>
              <option value="4">4★ & up</option>
              <option value="3">3★ & up</option>
              <option value="2">2★ & up</option>
            </select>
          </div>
          <CheckboxRow>
            <input type="checkbox" checked={inStock} data-testid="in-stock-checkbox" onChange={e => updateParams({ inStock: e.target.checked ? '1' : null })} />
            In stock only
          </CheckboxRow>
          <CheckboxRow>
            <input type="checkbox" checked={onSale} data-testid="on-sale-checkbox" onChange={e => updateParams({ onSale: e.target.checked ? '1' : null })} />
            On sale
          </CheckboxRow>
          <button
            type="button"
            className="btn-outline"
            data-testid="clear-filters-button"
            disabled={!hasFilters}
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Clear all filters
          </button>
        </Sidebar>

        <section>
          <Toolbar>
            <span data-testid="results-count">
              {loading || priceError ? '' : pagination && pagination.total > 0 ? `Showing ${from}-${to} of ${pagination.total} products` : '0 products'}
            </span>
            <label>
              Sort by{' '}
              <select value={sort} data-testid="sort-select" onChange={e => updateParams({ sort: e.target.value === 'relevance' ? null : e.target.value })}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </Toolbar>

          {error && <Alert variant="error" testId="products-error">{error}</Alert>}

          {loading && !priceError ? (
            <EmptyState data-testid="products-loading">Loading products...</EmptyState>
          ) : !error && !priceError && list.length === 0 ? (
            <EmptyState data-testid="no-results">
              <p>No products match your filters.</p>
              {hasFilters && (
                <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Clear all filters
                </button>
              )}
            </EmptyState>
          ) : !priceError ? (
            <>
              <ProductGrid data-testid="product-grid">
                {list.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ProductGrid>
              {pagination && pagination.totalPages > 1 && (
                <Pagination aria-label="Pagination" data-testid="pagination">
                  <PageButton type="button" data-testid="prev-page-button" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) }, false)}>
                    Previous
                  </PageButton>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(n => (
                    <PageButton
                      key={n}
                      type="button"
                      $active={n === page}
                      aria-current={n === page ? 'page' : undefined}
                      data-testid={`page-button-${n}`}
                      onClick={() => updateParams({ page: String(n) }, false)}
                    >
                      {n}
                    </PageButton>
                  ))}
                  <PageButton
                    type="button"
                    data-testid="next-page-button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => updateParams({ page: String(page + 1) }, false)}
                  >
                    Next
                  </PageButton>
                </Pagination>
              )}
            </>
          ) : null}
        </section>
      </Layout>
    </Page>
  );
};

export default Products;
