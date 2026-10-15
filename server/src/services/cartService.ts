import { Coupon, Product, ShippingMethod } from '../models';
import cartRepository from '../repositories/cartRepository';
import couponRepository from '../repositories/couponRepository';
import productRepository from '../repositories/productRepository';
import { FREE_SHIPPING_THRESHOLD, computeShipping, computeTax, round2 } from './pricing';

export interface CartLine {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CouponError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const evaluateCoupon = (coupon: Coupon, lines: CartLine[], now = new Date()): number => {
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    throw new CouponError('This coupon has expired', 400);
  }
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  if (subtotal < coupon.minSubtotal) {
    throw new CouponError(`A minimum order of $${coupon.minSubtotal.toFixed(2)} is required for this coupon`, 400);
  }
  const eligible = coupon.category ? lines.filter(line => line.product.category === coupon.category) : lines;
  if (coupon.category && eligible.length === 0) {
    throw new CouponError(`This coupon only applies to ${coupon.category} items`, 400);
  }
  const eligibleTotal = eligible.reduce((sum, line) => sum + line.subtotal, 0);
  if (coupon.type === 'percent') return round2(eligibleTotal * coupon.value / 100);
  if (coupon.type === 'fixed') return round2(Math.min(coupon.value, eligibleTotal));
  return 0;
};

export const buildCartSummary = async (userId: string) => {
  const items = await cartRepository.findByUserId(userId);
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = await productRepository.findById(item.productId);
    if (!product) {
      await cartRepository.delete(item.id);
      continue;
    }
    lines.push({
      id: item.id,
      cartId: userId,
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      product,
      subtotal: round2(product.price * item.quantity),
      createdAt: item.addedAt,
      updatedAt: item.addedAt
    });
  }

  const subtotal = round2(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);

  let coupon: Coupon | null = null;
  let discount = 0;
  let couponMessage: string | undefined;
  const code = cartRepository.getCoupon(userId);
  if (code) {
    coupon = await couponRepository.findByCode(code);
    try {
      if (!coupon || lines.length === 0) throw new CouponError('Your cart is empty', 400);
      discount = evaluateCoupon(coupon, lines);
    } catch (error) {
      cartRepository.clearCoupon(userId);
      if (lines.length > 0 && error instanceof CouponError) {
        couponMessage = `Coupon ${code} was removed: ${error.message}`;
      }
      coupon = null;
      discount = 0;
    }
  }

  const totalPrice = round2(subtotal - discount);
  const freeShipping = coupon?.type === 'free_shipping';
  const amountToFreeShipping = freeShipping ? 0 : round2(Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice));

  return {
    id: userId,
    userId,
    items: lines,
    totalItems,
    subtotal,
    discount,
    coupon: coupon ? { code: coupon.code, description: coupon.description, type: coupon.type } : null,
    couponMessage,
    totalPrice,
    totalAmount: totalPrice,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const buildQuote = async (userId: string, shippingMethod: ShippingMethod) => {
  const cart = await buildCartSummary(userId);
  const freeShipping = cart.coupon?.type === 'free_shipping';
  const shipping = cart.items.length ? computeShipping(shippingMethod, cart.totalPrice, freeShipping) : 0;
  const tax = computeTax(cart.totalPrice);
  return {
    cart,
    quote: {
      subtotal: cart.subtotal,
      discount: cart.discount,
      couponCode: cart.coupon?.code,
      shippingMethod,
      shipping,
      tax,
      total: round2(cart.totalPrice + shipping + tax)
    }
  };
};
