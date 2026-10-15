import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage, getFieldErrors } from '../services/apiClient';
import { AdminOrder, AdminStats, FieldErrors, OrderStatusValue, Product } from '../types';
import { Alert, ConfirmDialog, DialogActions, FieldError, Modal, Page, PageTitle, StatusBadge, Tabs } from '../components/ui';
import { STATUS_LABELS, formatCurrency, formatDate } from '../utils/format';

const LOW_STOCK = 5;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const Stat = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 20px;

  .value {
    font-size: 1.8rem;
    font-weight: 700;
  }

  .label {
    color: #6c757d;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid #e9ecef;
    text-align: left;
  }

  th {
    background: #f8f9fa;
  }

  td button, td select {
    padding: 6px 10px;
    width: auto;
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  input, select {
    width: auto;
    min-width: 220px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  .full {
    grid-column: 1 / -1;
  }
`;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getAdminStats().then(setStats).catch(err => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert variant="error" testId="admin-stats-error">{error}</Alert>;
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  const cards: [string, string, string | number][] = [
    ['stat-total-products', 'Products', stats.totalProducts],
    ['stat-low-stock', `Low stock (≤ ${LOW_STOCK})`, stats.lowStock],
    ['stat-out-of-stock', 'Out of stock', stats.outOfStock],
    ['stat-total-orders', 'Orders', stats.totalOrders],
    ['stat-revenue', 'Revenue (excl. cancelled)', formatCurrency(stats.revenue)],
    ['stat-customers', 'Customers', stats.totalCustomers],
  ];

  return (
    <div data-testid="admin-dashboard">
      <StatGrid>
        {cards.map(([testId, label, value]) => (
          <Stat key={testId} data-testid={testId}>
            <div className="value">{value}</div>
            <div className="label">{label}</div>
          </Stat>
        ))}
      </StatGrid>
      <h2 style={{ marginBottom: 12 }}>Orders by status</h2>
      <Table data-testid="orders-by-status">
        <tbody>
          {(Object.keys(stats.ordersByStatus) as OrderStatusValue[]).map(status => (
            <tr key={status}>
              <td><StatusBadge $status={status}>{status}</StatusBadge></td>
              <td data-testid={`orders-count-${status}`}>{stats.ordersByStatus[status]}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

interface ProductDraft {
  id?: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  originalPrice: string;
  stock: string;
  description: string;
  imageUrl: string;
  featured: boolean;
}

const emptyDraft = (category: string): ProductDraft => ({
  name: '', brand: '', category, price: '', originalPrice: '', stock: '0', description: '', imageUrl: '', featured: false,
});

const validateDraft = (d: ProductDraft): FieldErrors => {
  const errors: FieldErrors = {};
  if (d.name.trim().length < 3 || d.name.trim().length > 100) errors.name = 'Name must be 3-100 characters';
  if (!d.brand.trim()) errors.brand = 'Brand is required';
  const price = Number(d.price);
  if (d.price === '' || !Number.isFinite(price) || price <= 0) errors.price = 'Price must be greater than 0';
  else if (!/^\d+(\.\d{1,2})?$/.test(d.price)) errors.price = 'Price can have at most 2 decimals';
  if (d.originalPrice !== '' && !(Number(d.originalPrice) > price)) errors.originalPrice = 'Original price must be higher than the price';
  if (!/^\d+$/.test(d.stock) || Number(d.stock) > 10000) errors.stock = 'Stock must be a whole number from 0 to 10000';
  if (d.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
  if (d.imageUrl && !/^https?:\/\/\S+$/.test(d.imageUrl)) errors.imageUrl = 'Image URL must start with http:// or https://';
  return errors;
};

const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [draftError, setDraftError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await apiClient.getAdminProducts(search || undefined));
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiClient.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const field = (name: keyof ProductDraft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, full = false) => (
    <div className={`form-group${full ? ' full' : ''}`}>
      <label className="form-label" htmlFor={`product-${name}`}>{label}</label>
      <input
        id={`product-${name}`}
        value={String(draft![name])}
        data-testid={`product-${name}-input`}
        onChange={e => setDraft({ ...draft!, [name]: e.target.value })}
        {...props}
      />
      <FieldError message={errors[name]} testId={`product-${name}-error`} />
    </div>
  );

  const openEdit = (p: Product) => {
    setErrors({});
    setDraftError(null);
    setDraft({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      stock: String(p.stock),
      description: p.description,
      imageUrl: p.imageUrl || '',
      featured: p.featured,
    });
  };

  const save = async () => {
    if (!draft) return;
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setDraftError(null);
    const payload: Partial<Product> = {
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      category: draft.category,
      price: Number(draft.price),
      originalPrice: draft.originalPrice === '' ? undefined : Number(draft.originalPrice),
      stock: Number(draft.stock),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
      featured: draft.featured,
    };
    try {
      if (draft.id) await apiClient.updateProduct(draft.id, payload);
      else await apiClient.createProduct(payload);
      setMessage({ text: draft.id ? `${payload.name} updated.` : `${payload.name} created.`, variant: 'success' });
      setDraft(null);
      await load();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setDraftError(getErrorMessage(err, 'Could not save the product'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiClient.deleteProduct(deleting.id);
      setMessage({ text: `${deleting.name} deleted.`, variant: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  return (
    <div data-testid="admin-products">
      {message && <Alert variant={message.variant} testId="admin-products-message">{message.text}</Alert>}
      <Toolbar>
        <input type="search" placeholder="Search by name or brand" aria-label="Search products" value={search} data-testid="admin-product-search" onChange={e => setSearch(e.target.value)} />
        <button type="button" className="btn-primary" data-testid="add-product-button" onClick={() => { setErrors({}); setDraftError(null); setDraft(emptyDraft(categories[0] || '')); }}>
          Add product
        </button>
      </Toolbar>
      <div style={{ overflowX: 'auto' }}>
        <Table data-testid="admin-product-table">
          <thead>
            <tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products?.map(p => (
              <tr key={p.id} data-testid="admin-product-row" data-product-id={p.id}>
                <td data-testid="admin-product-name"><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                <td>{p.brand}</td>
                <td>{p.category}</td>
                <td data-testid="admin-product-price">{formatCurrency(p.price)}</td>
                <td data-testid="admin-product-stock" style={{ color: p.stock === 0 ? '#dc3545' : p.stock <= LOW_STOCK ? '#fd7e14' : undefined }}>
                  {p.stock}{p.stock === 0 ? ' (out)' : p.stock <= LOW_STOCK ? ' (low)' : ''}
                </td>
                <td>
                  <button type="button" className="btn-outline" data-testid="edit-product-button" onClick={() => openEdit(p)}>Edit</button>{' '}
                  <button type="button" className="btn-danger" data-testid="delete-product-button" onClick={() => setDeleting(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {products && products.length === 0 && <p style={{ padding: 16 }} data-testid="admin-no-products">No products match your search.</p>}
      </div>

      {draft && (
        <Modal title={draft.id ? 'Edit product' : 'Add product'} testId="product-modal" onClose={() => setDraft(null)}>
          {draftError && <Alert variant="error" testId="product-modal-error">{draftError}</Alert>}
          <FormGrid>
            {field('name', 'Name', {}, true)}
            {field('brand', 'Brand')}
            <div className="form-group">
              <label className="form-label" htmlFor="product-category">Category</label>
              <select id="product-category" value={draft.category} data-testid="product-category-select" onChange={e => setDraft({ ...draft, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FieldError message={errors.category} testId="product-category-error" />
            </div>
            {field('price', 'Price ($)', { inputMode: 'decimal' })}
            {field('originalPrice', 'Original price ($, optional)', { inputMode: 'decimal' })}
            {field('stock', 'Stock', { inputMode: 'numeric' })}
            {field('imageUrl', 'Image URL (optional)')}
            <div className="form-group full">
              <label className="form-label" htmlFor="product-description">Description</label>
              <textarea id="product-description" rows={3} value={draft.description} data-testid="product-description-input" onChange={e => setDraft({ ...draft, description: e.target.value })} />
              <FieldError message={errors.description} testId="product-description-error" />
            </div>
          </FormGrid>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={draft.featured} data-testid="product-featured-checkbox" onChange={e => setDraft({ ...draft, featured: e.target.checked })} />
            Featured on the home page
          </label>
          <DialogActions>
            <button type="button" className="btn-secondary" data-testid="product-cancel-button" onClick={() => setDraft(null)}>Cancel</button>
            <button type="button" className="btn-primary" data-testid="product-save-button" disabled={busy} onClick={save}>
              {busy ? 'Saving...' : 'Save product'}
            </button>
          </DialogActions>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product?"
          message={`${deleting.name} will be removed from the store, carts and wishlists.`}
          confirmLabel="Delete"
          testId="confirm-delete-product"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

const OrdersTab: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [selected, setSelected] = useState<Record<string, OrderStatusValue>>({});
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await apiClient.getAdminOrders((status || undefined) as OrderStatusValue | undefined));
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (order: AdminOrder) => {
    const next = selected[order.id] || order.allowedTransitions[0];
    if (!next) return;
    try {
      await apiClient.updateOrderStatus(order.id, next);
      setMessage({ text: `${order.orderNumber} marked ${STATUS_LABELS[next].toLowerCase()}.`, variant: 'success' });
      setSelected(prev => {
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
      });
      await load();
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    }
  };

  return (
    <div data-testid="admin-orders">
      {message && <Alert variant={message.variant} testId="admin-orders-message">{message.text}</Alert>}
      <Toolbar>
        <select aria-label="Filter by status" value={status} data-testid="admin-order-status-filter" onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABELS).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </Toolbar>
      <div style={{ overflowX: 'auto' }}>
        <Table data-testid="admin-order-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Status</th><th>Update</th></tr>
          </thead>
          <tbody>
            {orders?.map(order => (
              <tr key={order.id} data-testid="admin-order-row" data-order-id={order.id}>
                <td data-testid="admin-order-number">{order.orderNumber}</td>
                <td>{order.customer ? `${order.customer.name} (${order.customer.email})` : 'Unknown'}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatCurrency(order.total)}</td>
                <td><StatusBadge $status={order.status} data-testid="admin-order-status">{order.status}</StatusBadge></td>
                <td>
                  {order.allowedTransitions.length === 0 ? (
                    <span style={{ color: '#6c757d' }} data-testid="admin-order-final">Final</span>
                  ) : (
                    <>
                      <select
                        aria-label={`New status for ${order.orderNumber}`}
                        value={selected[order.id] || order.allowedTransitions[0]}
                        data-testid="admin-order-next-status"
                        onChange={e => setSelected({ ...selected, [order.id]: e.target.value as OrderStatusValue })}
                      >
                        {order.allowedTransitions.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>{' '}
                      <button type="button" className="btn-primary" data-testid="admin-order-update-button" onClick={() => update(order)}>Update</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {orders && orders.length === 0 && <p style={{ padding: 16 }} data-testid="admin-no-orders">No orders with this status.</p>}
      </div>
    </div>
  );
};

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
];

const Admin: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(t => t.id === params.get('tab')) ? (params.get('tab') as string) : 'dashboard';
  return (
    <Page data-testid="admin-page">
      <PageTitle>Admin</PageTitle>
      <Tabs tabs={TABS} active={tab} testId="admin-tabs" onChange={id => setParams({ tab: id }, { replace: true })} />
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'orders' && <OrdersTab />}
    </Page>
  );
};

export default Admin;
