import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { useCart } from '../hooks/useCart';
import { Order } from '../types';
import { Alert, ConfirmDialog, FieldError, Page, StatusBadge } from '../components/ui';
import { PAYMENT_LABELS, SHIPPING_LABELS, STATUS_LABELS, formatCurrency, formatDate } from '../utils/format';

const CANCEL_REASONS = ['Changed my mind', 'Found a better price', 'Ordered by mistake', 'Delivery is too slow', 'Other'];

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  h2 {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
`;

const Timeline = styled.ol`
  list-style: none;
  border-left: 3px solid #e9ecef;
  padding-left: 16px;

  li {
    margin-bottom: 12px;
  }

  .when {
    color: #6c757d;
    font-size: 0.85rem;
  }
`;

const Line = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;

  img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
  }
`;

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { setCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: React.ReactNode; variant: 'success' | 'error' | 'warning' } | null>(
    (location.state as { placed?: boolean } | null)?.placed ? { text: 'Thank you! Your order has been placed.', variant: 'success' } : null
  );
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setOrder(await apiClient.getOrder(id));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load order'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Page>
        <Alert variant="error" testId="order-error">{error}</Alert>
        <Link to="/orders">Back to orders</Link>
      </Page>
    );
  }
  if (!order) return <Page><div className="loading">Loading order...</div></Page>;

  const cancellable = order.status === 'pending' || order.status === 'processing';

  const handleCancel = async () => {
    const finalReason = reason === 'Other' ? otherReason.trim() : reason;
    if (reason === 'Other' && !finalReason) {
      setCancelError('Tell us why you are cancelling');
      return;
    }
    setCancelError(null);
    setBusy(true);
    try {
      setOrder(await apiClient.cancelOrder(order.id, finalReason));
      setShowCancel(false);
      setMessage({ text: `Order ${order.orderNumber} was cancelled.`, variant: 'success' });
    } catch (err) {
      setShowCancel(false);
      setMessage({ text: getErrorMessage(err, 'Could not cancel the order'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async () => {
    setBusy(true);
    try {
      const result = await apiClient.reorder(order.id);
      setCart(result.cart);
      setMessage({
        variant: result.skipped.length ? 'warning' : 'success',
        text: (
          <span data-testid="reorder-result">
            {result.added.length > 0 && <>Added {result.added.map(a => `${a.quantity} × ${a.productName}`).join(', ')} to your cart. </>}
            {result.skipped.length > 0 && <>Not added: {result.skipped.map(s => `${s.productName} (${s.reason})`).join(', ')}. </>}
            {result.added.length > 0 && <Link to="/cart" data-testid="reorder-go-to-cart">Go to cart</Link>}
          </span>
        ),
      });
    } catch (err) {
      setMessage({ text: getErrorMessage(err, 'Could not reorder'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page data-testid="order-detail-page">
      <Link to="/orders" data-testid="back-to-orders">← All orders</Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
        <h1 data-testid="order-detail-number">Order {order.orderNumber}</h1>
        <StatusBadge $status={order.status} data-testid="order-detail-status">{order.status}</StatusBadge>
      </div>
      <p style={{ color: '#6c757d', marginBottom: 16 }}>
        Placed {formatDate(order.createdAt)}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <> · Estimated delivery <span data-testid="estimated-delivery">{formatDate(order.estimatedDelivery)}</span></>
        )}
      </p>
      {message && <Alert variant={message.variant} testId="order-detail-message">{message.text}</Alert>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {cancellable && (
          <button type="button" className="btn-danger" data-testid="cancel-order-button" disabled={busy} onClick={() => setShowCancel(true)}>
            Cancel order
          </button>
        )}
        <button type="button" className="btn-outline" data-testid="reorder-button" disabled={busy} onClick={handleReorder}>
          Buy again
        </button>
      </div>

      <Grid>
        <div>
          <Card data-testid="order-items">
            <h2>Items</h2>
            {order.items.map(item => (
              <Line key={item.id} data-testid="order-line">
                <img src={item.product?.imageUrl} alt={item.productName} />
                <div>
                  <Link to={`/products/${item.productId}`} data-testid="order-line-name">{item.productName}</Link>
                  <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                    <span data-testid="order-line-quantity">{item.quantity}</span> × {formatCurrency(item.price)}
                  </div>
                  {order.status === 'delivered' && (
                    <Link to={`/products/${item.productId}#reviews-heading`} style={{ fontSize: '0.85rem' }} data-testid="write-review-link">Write a review</Link>
                  )}
                </div>
                <strong>{formatCurrency(item.subtotal)}</strong>
              </Line>
            ))}
          </Card>
          <Card data-testid="order-timeline">
            <h2>Order history</h2>
            <Timeline>
              {order.statusHistory.map((event, index) => (
                <li key={index} data-testid="timeline-event" data-status={event.status}>
                  <strong>{STATUS_LABELS[event.status]}</strong>
                  <div className="when">{formatDate(event.date)}{event.note ? ` · ${event.note}` : ''}</div>
                </li>
              ))}
            </Timeline>
            {order.cancellationReason && <p data-testid="cancellation-reason">Cancellation reason: {order.cancellationReason}</p>}
          </Card>
        </div>
        <div>
          <Card data-testid="order-price-breakdown">
            <h2>Payment summary</h2>
            <div className="row"><span>Subtotal</span><span data-testid="detail-subtotal">{formatCurrency(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="row"><span>Discount ({order.couponCode})</span><span data-testid="detail-discount">−{formatCurrency(order.discount)}</span></div>
            )}
            <div className="row"><span>Shipping ({SHIPPING_LABELS[order.shippingMethod]})</span><span data-testid="detail-shipping">{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</span></div>
            <div className="row"><span>Tax</span><span data-testid="detail-tax">{formatCurrency(order.tax)}</span></div>
            <div className="row" style={{ fontWeight: 700 }}><span>Total</span><span data-testid="detail-total">{formatCurrency(order.total)}</span></div>
            <p style={{ marginTop: 8 }} data-testid="detail-payment-method">
              Paid with {PAYMENT_LABELS[order.paymentMethod]}{order.cardLast4 ? ` ending in ${order.cardLast4}` : ''}
            </p>
          </Card>
          <Card data-testid="order-shipping-address">
            <h2>Shipping address</h2>
            <p>
              {order.shippingAddress.fullName && <>{order.shippingAddress.fullName}<br /></>}
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.zipCode}<br />
              {order.shippingAddress.country}
            </p>
          </Card>
        </div>
      </Grid>

      {showCancel && (
        <ConfirmDialog
          title={`Cancel order ${order.orderNumber}?`}
          message="Items go back to stock and you will not be charged."
          confirmLabel="Cancel order"
          testId="confirm-cancel-order"
          busy={busy}
          onConfirm={handleCancel}
          onCancel={() => { setShowCancel(false); setCancelError(null); }}
        >
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label" htmlFor="cancel-reason">Reason</label>
            <select id="cancel-reason" value={reason} data-testid="cancel-reason-select" onChange={e => setReason(e.target.value)}>
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {reason === 'Other' && (
            <div className="form-group">
              <label className="form-label" htmlFor="cancel-other">Tell us more</label>
              <textarea id="cancel-other" rows={3} maxLength={200} value={otherReason} data-testid="cancel-reason-other" onChange={e => setOtherReason(e.target.value)} />
              <FieldError message={cancelError || undefined} testId="cancel-reason-error" />
            </div>
          )}
        </ConfirmDialog>
      )}
    </Page>
  );
};

export default OrderDetail;
