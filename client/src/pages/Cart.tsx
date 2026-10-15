import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { Alert, ConfirmDialog, EmptyState, Page, PageTitle } from '../components/ui';
import { formatCurrency } from '../utils/format';

const MAX_PER_ITEM = 10;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
  }
`;

const Qty = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;

  button {
    padding: 4px 12px;
    background: #e9ecef;
  }
`;

const LinkButton = styled.button`
  background: none;
  color: #007bff;
  padding: 4px 0;
  margin-right: 16px;
`;

const Summary = styled.aside`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: fit-content;

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .total {
    font-weight: 700;
    font-size: 1.2rem;
    border-top: 1px solid #e9ecef;
    padding-top: 10px;
  }
`;

const CouponForm = styled.form`
  display: flex;
  gap: 8px;
  margin: 16px 0 8px;

  button {
    white-space: nowrap;
  }
`;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, error, updateCartItem, removeFromCart, moveToWishlist, clearCart, applyCoupon, removeCoupon } = useCart();
  const { refresh: refreshWishlist } = useWishlist();
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const runItem = async (itemId: string, action: () => Promise<void>, success?: string) => {
    setItemErrors(prev => ({ ...prev, [itemId]: '' }));
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ text: success, variant: 'success' });
    } catch (err) {
      setItemErrors(prev => ({ ...prev, [itemId]: err instanceof Error ? err.message : 'Something went wrong' }));
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setMessage(null);
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code');
      return;
    }
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode('');
      setMessage({ text: 'Coupon applied.', variant: 'success' });
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Could not apply coupon');
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setConfirmClear(false);
      setMessage({ text: 'Your cart was cleared.', variant: 'success' });
    } catch (err) {
      setConfirmClear(false);
      setMessage({ text: err instanceof Error ? err.message : 'Could not clear the cart', variant: 'error' });
    }
  };

  if (!cart && loading) {
    return <Page><div className="loading" data-testid="cart-loading">Loading your cart...</div></Page>;
  }

  const items = cart?.items || [];

  return (
    <Page data-testid="cart-page">
      <PageTitle>Shopping Cart</PageTitle>
      {error && !message && <Alert variant="error" testId="cart-error">{error}</Alert>}
      {cart?.couponMessage && <Alert variant="warning" testId="coupon-removed-message">{cart.couponMessage}</Alert>}
      {message && <Alert variant={message.variant} testId="cart-message">{message.text}</Alert>}

      {items.length === 0 ? (
        <EmptyState data-testid="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/products" style={{ display: 'inline-block', marginTop: 12 }} data-testid="continue-shopping">Continue shopping</Link>
        </EmptyState>
      ) : (
        <Layout>
          <div data-testid="cart-items">
            {items.map(item => {
              const max = Math.min(item.product.stock, MAX_PER_ITEM);
              return (
                <Item key={item.id} data-testid="cart-item" data-product-id={item.productId}>
                  <img src={item.product.imageUrl} alt={item.product.name} />
                  <div>
                    <Link to={`/products/${item.productId}`} data-testid="item-name" style={{ fontWeight: 600, color: '#333' }}>{item.product.name}</Link>
                    <div data-testid="item-price">{formatCurrency(item.price)} each</div>
                    {item.product.stock < item.quantity && (
                      <div className="error-message" data-testid="item-stock-warning">
                        {item.product.stock === 0 ? 'Out of stock — remove this item to check out' : `Only ${item.product.stock} available`}
                      </div>
                    )}
                    <Qty>
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        data-testid="decrease-quantity"
                        disabled={item.quantity <= 1 || loading}
                        onClick={() => runItem(item.id, () => updateCartItem(item.id, item.quantity - 1))}
                      >
                        −
                      </button>
                      <span data-testid="item-quantity">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.product.name}`}
                        data-testid="increase-quantity"
                        disabled={item.quantity >= max || loading}
                        onClick={() => runItem(item.id, () => updateCartItem(item.id, item.quantity + 1))}
                      >
                        +
                      </button>
                    </Qty>
                    <div style={{ marginTop: 8 }}>
                      <LinkButton type="button" data-testid="move-to-wishlist" onClick={() => runItem(item.id, async () => { await moveToWishlist(item.id); await refreshWishlist(); }, `${item.product.name} moved to your wishlist.`)}>
                        Save for later
                      </LinkButton>
                      <LinkButton type="button" data-testid="remove-item" style={{ color: '#dc3545' }} onClick={() => runItem(item.id, () => removeFromCart(item.id), `${item.product.name} removed from your cart.`)}>
                        Remove
                      </LinkButton>
                    </div>
                    {itemErrors[item.id] && <div className="error-message" role="alert" data-testid="item-error">{itemErrors[item.id]}</div>}
                  </div>
                  <div style={{ fontWeight: 700 }} data-testid="item-subtotal">{formatCurrency(item.subtotal)}</div>
                </Item>
              );
            })}
            <button type="button" className="btn-outline" data-testid="clear-cart" onClick={() => setConfirmClear(true)}>
              Clear cart
            </button>
          </div>

          <Summary data-testid="cart-summary">
            <h2 style={{ marginBottom: 16 }}>Order Summary</h2>
            <div className="row">
              <span>Items ({cart!.totalItems})</span>
              <span data-testid="cart-subtotal">{formatCurrency(cart!.subtotal)}</span>
            </div>
            {cart!.coupon && (
              <div className="row" style={{ color: '#28a745' }}>
                <span>
                  Coupon <strong data-testid="applied-coupon-code">{cart!.coupon.code}</strong>
                </span>
                <span data-testid="cart-discount">−{formatCurrency(cart!.discount)}</span>
              </div>
            )}
            <div className="row total">
              <span>Total</span>
              <span data-testid="cart-total">{formatCurrency(cart!.totalPrice)}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>Shipping and tax are calculated at checkout.</p>
            <p style={{ fontSize: '0.9rem', margin: '8px 0' }} data-testid="free-shipping-message">
              {cart!.coupon?.type === 'free_shipping'
                ? 'Free standard shipping applied.'
                : cart!.amountToFreeShipping > 0
                  ? `Add ${formatCurrency(cart!.amountToFreeShipping)} more for free standard shipping.`
                  : 'You qualify for free standard shipping.'}
            </p>

            {cart!.coupon ? (
              <div style={{ margin: '12px 0' }}>
                <span style={{ fontSize: '0.9rem' }}>{cart!.coupon.description}</span>{' '}
                <LinkButton type="button" data-testid="remove-coupon-button" onClick={async () => { await removeCoupon(); setMessage({ text: 'Coupon removed.', variant: 'success' }); }}>
                  Remove
                </LinkButton>
              </div>
            ) : (
              <CouponForm onSubmit={handleApplyCoupon} noValidate>
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={couponCode}
                  data-testid="coupon-input"
                  onChange={e => setCouponCode(e.target.value)}
                />
                <button type="submit" className="btn-secondary" data-testid="apply-coupon-button" disabled={loading}>
                  Apply
                </button>
              </CouponForm>
            )}
            {couponError && <div className="error-message" role="alert" data-testid="coupon-error">{couponError}</div>}

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              data-testid="checkout-button"
              disabled={items.some(i => i.product.stock < i.quantity)}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </Summary>
        </Layout>
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Clear cart?"
          message="This removes every item from your cart."
          confirmLabel="Clear cart"
          testId="confirm-clear-cart"
          busy={loading}
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </Page>
  );
};

export default Cart;
