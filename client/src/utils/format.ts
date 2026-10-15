export const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;

export const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const SHIPPING_LABELS: Record<string, string> = {
  standard: 'Standard',
  express: 'Express',
  overnight: 'Overnight',
};

export const PAYMENT_LABELS: Record<string, string> = {
  card: 'Card',
  paypal: 'PayPal',
  cod: 'Cash on delivery',
};
