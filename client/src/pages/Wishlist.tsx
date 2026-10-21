import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useWishlist } from '../hooks/useWishlist';
import { Alert, EmptyState, Page, PageTitle } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

const Item = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 16px;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  img {
    width: 90px;
    height: 90px;
    object-fit: cover;
    border-radius: 6px;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  @media (max-width: 640px) {
    grid-template-columns: 70px 1fr;

    .actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
  }
`;

export default function Wishlist() {
  const { wishlist, loaded, remove, moveToCart } = useWishlist();
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (productId: string, action: () => Promise<void>, success: string) => {
    setBusyId(productId);
    setMessage(null);
    try {
      await action();
      setMessage({ text: success, variant: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Something went wrong', variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const items = wishlist?.items || [];

  return (
    <Page data-testid="wishlist-page">
      <PageTitle>My Wishlist</PageTitle>
      {loaded && (
        <p style={{ marginBottom: 16 }} data-testid="wishlist-count">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      )}
      {message && <Alert variant={message.variant} testId="wishlist-message">{message.text}</Alert>}

      {!loaded ? (
        <EmptyState data-testid="wishlist-loading">Loading your wishlist...</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState data-testid="wishlist-empty">
          <p>Your wishlist is empty.</p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', textDecoration: 'none', borderRadius: 4 }}>
            Browse products
          </Link>
        </EmptyState>
      ) : (
        <div data-testid="wishlist-list">
          {items.map(({ product, productId, addedAt }) => (
            <Item key={productId} data-testid="wishlist-item" data-product-id={productId}>
              <img src={product.imageUrl} alt={product.name} />
              <div>
                <Link to={`/products/${productId}`} data-testid="wishlist-item-name" style={{ fontWeight: 600, color: '#333' }}>
                  {product.name}
                </Link>
                <div data-testid="wishlist-item-price">{formatCurrency(product.price)}</div>
                <div style={{ fontSize: '0.85rem', color: product.stock > 0 ? '#28a745' : '#dc3545' }} data-testid="wishlist-item-stock">
                  {product.stock > 0 ? 'In stock' : 'Out of stock'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Added {formatDate(addedAt)}</div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-primary"
                  data-testid="wishlist-move-to-cart"
                  disabled={product.stock === 0 || busyId === productId}
                  onClick={() => act(productId, () => moveToCart(productId), `${product.name} moved to your cart.`)}
                >
                  Move to cart
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  data-testid="wishlist-remove-button"
                  disabled={busyId === productId}
                  onClick={() => act(productId, () => remove(productId), `${product.name} removed from your wishlist.`)}
                >
                  Remove
                </button>
              </div>
            </Item>
          ))}
        </div>
      )}
    </Page>
  );
}
