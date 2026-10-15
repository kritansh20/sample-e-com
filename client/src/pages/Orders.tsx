import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { Order, OrderStatusValue } from '../types';
import { Alert, EmptyState, Page, PageTitle, StatusBadge, Tabs } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const OrderCard = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;

  .meta {
    color: #6c757d;
    font-size: 0.9rem;
  }
`;

const Orders: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setOrders(null);
    setError(null);
    apiClient
      .getOrders(status === 'all' ? undefined : (status as OrderStatusValue))
      .then(list => { if (id === requestId.current) setOrders(list); })
      .catch(err => { if (id === requestId.current) setError(getErrorMessage(err, 'Failed to load orders')); });
  }, [status]);

  return (
    <Page data-testid="orders-page">
      <PageTitle>My Orders</PageTitle>
      <Tabs
        tabs={FILTERS}
        active={status}
        testId="order-status-filter"
        onChange={id => setParams(id === 'all' ? new URLSearchParams() : new URLSearchParams({ status: id }), { replace: true })}
      />
      {error && <Alert variant="error" testId="orders-error">{error}</Alert>}
      {!orders && !error && <EmptyState data-testid="orders-loading">Loading orders...</EmptyState>}
      {orders && orders.length === 0 && (
        <EmptyState data-testid="no-orders">
          {status === 'all' ? (
            <>
              <p>You have not placed any orders yet.</p>
              <Link to="/products" style={{ display: 'inline-block', marginTop: 12 }}>Start shopping</Link>
            </>
          ) : (
            <p>No {status} orders.</p>
          )}
        </EmptyState>
      )}
      {orders && orders.length > 0 && (
        <div data-testid="order-list">
          {orders.map(order => (
            <OrderCard key={order.id} data-testid="order-card" data-order-id={order.id}>
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <strong data-testid="order-number">{order.orderNumber}</strong>
                  <StatusBadge $status={order.status} data-testid="order-status">{order.status}</StatusBadge>
                </div>
                <div className="meta">
                  Placed {formatDate(order.createdAt)} · <span data-testid="order-item-count">{order.items.reduce((n, i) => n + i.quantity, 0)} items</span> · Total{' '}
                  <span data-testid="order-total">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <Link to={`/orders/${order.id}`} className="btn-outline" style={{ padding: '8px 16px', borderRadius: 4, textDecoration: 'none' }} data-testid="view-order-button">
                View details
              </Link>
            </OrderCard>
          ))}
        </div>
      )}
    </Page>
  );
};

export default Orders;
