import { ShippingMethod } from '../models';

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 100;
export const COD_LIMIT = 500;
export const MAX_QUANTITY_PER_ITEM = 10;

export const SHIPPING_METHODS: Record<ShippingMethod, { label: string; price: number; days: number }> = {
  standard: { label: 'Standard (5-7 business days)', price: 5.99, days: 7 },
  express: { label: 'Express (2-3 business days)', price: 14.99, days: 3 },
  overnight: { label: 'Overnight (next business day)', price: 29.99, days: 1 },
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const isShippingMethod = (value: unknown): value is ShippingMethod =>
  typeof value === 'string' && value in SHIPPING_METHODS;

export const computeShipping = (method: ShippingMethod, merchandiseTotal: number, freeShippingCoupon: boolean) => {
  if (method === 'standard' && (freeShippingCoupon || merchandiseTotal >= FREE_SHIPPING_THRESHOLD)) return 0;
  return SHIPPING_METHODS[method].price;
};

export const computeTax = (taxableAmount: number) => round2(Math.max(0, taxableAmount) * TAX_RATE);

export const estimateDelivery = (from: Date, method: ShippingMethod) =>
  new Date(from.getTime() + SHIPPING_METHODS[method].days * 24 * 60 * 60 * 1000);
