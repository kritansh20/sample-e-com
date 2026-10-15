import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../services/apiClient';
import { MAX_COMPARE, useCompare } from '../hooks/useCompare';
import { Product } from '../types';
import { EmptyState, Page, PageTitle } from '../components/ui';
import { formatCurrency } from '../utils/format';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    text-align: left;
    vertical-align: top;
  }

  th[scope='row'] {
    width: 160px;
    color: #6c757d;
    font-weight: 600;
  }
`;

const Best = styled.span`
  margin-left: 6px;
  font-size: 0.75rem;
  background: #d4edda;
  color: #155724;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ROWS: { key: string; label: string; render: (p: Product) => React.ReactNode }[] = [
  { key: 'price', label: 'Price', render: p => formatCurrency(p.price) },
  { key: 'brand', label: 'Brand', render: p => p.brand },
  { key: 'category', label: 'Category', render: p => p.category },
  { key: 'rating', label: 'Rating', render: p => (p.reviewCount ? `${p.rating.toFixed(1)} (${p.reviewCount})` : 'No reviews') },
  { key: 'stock', label: 'Availability', render: p => (p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock') },
];

export default function CompareProducts() {
  const { ids, remove, clear } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all(ids.map(id => apiClient.getProduct(id).catch(() => null))).then(results => {
      if (!active) return;
      const found = results.filter((p): p is Product => p !== null);
      setProducts(found);
      setMissing(results.length - found.length);
    });
    return () => {
      active = false;
    };
  }, [ids]);

  const cheapest = products.length > 1 ? Math.min(...products.map(p => p.price)) : null;
  const bestRated = products.length > 1 ? Math.max(...products.map(p => p.rating)) : null;

  return (
    <Page data-testid="compare-page">
      <PageTitle>Compare Products</PageTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span data-testid="compare-count">{ids.length} of {MAX_COMPARE} selected</span>
        <button type="button" className="btn-outline" data-testid="compare-clear-button" disabled={ids.length === 0} onClick={clear}>
          Clear all
        </button>
      </div>
      {missing > 0 && <p style={{ color: '#856404' }} data-testid="compare-missing">Some products are no longer available.</p>}

      {ids.length === 0 ? (
        <EmptyState data-testid="compare-empty">
          <p>No products selected. Tick "Compare" on up to {MAX_COMPARE} products to compare them here.</p>
          <Link to="/products" style={{ display: 'inline-block', marginTop: 12 }}>Browse products</Link>
        </EmptyState>
      ) : ids.length === 1 ? (
        <EmptyState data-testid="compare-need-more">
          <p>Select at least one more product to compare.</p>
          <Link to="/products" style={{ display: 'inline-block', marginTop: 12 }}>Add another product</Link>
        </EmptyState>
      ) : null}

      {products.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <Table data-testid="compare-table">
            <thead>
              <tr>
                <th />
                {products.map(p => (
                  <th key={p.id} data-testid="compare-column-head">
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                    <div>
                      <button type="button" className="btn-outline" style={{ padding: '4px 10px', marginTop: 8 }} data-testid="compare-remove-button" onClick={() => remove(p.id)}>
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.key} data-testid={`compare-row-${row.key}`}>
                  <th scope="row">{row.label}</th>
                  {products.map(p => (
                    <td key={p.id} data-testid={`compare-cell-${row.key}`}>
                      {row.render(p)}
                      {row.key === 'price' && cheapest !== null && p.price === cheapest && <Best data-testid="best-price">Lowest price</Best>}
                      {row.key === 'rating' && bestRated !== null && bestRated > 0 && p.rating === bestRated && <Best data-testid="best-rating">Top rated</Best>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Page>
  );
}
