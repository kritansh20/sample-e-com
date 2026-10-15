import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import orderRepository from '../repositories/orderRepository';
import cartRepository from '../repositories/cartRepository';
import productRepository from '../repositories/productRepository';
import addressRepository, { MAX_ADDRESSES } from '../repositories/addressRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { OrderStatus, PaymentMethod } from '../models';
import { buildCartSummary, buildQuote } from '../services/cartService';
import { COD_LIMIT, MAX_QUANTITY_PER_ITEM, SHIPPING_METHODS, estimateDelivery, isShippingMethod } from '../services/pricing';
import { cleanAddress, sendValidationError, validateAddress } from '../utils/validation';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_METHODS: PaymentMethod[] = ['card', 'paypal', 'cod'];
export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'processing'];

const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    if (status && !ORDER_STATUSES.includes(status as OrderStatus)) {
      return sendValidationError(res, { status: `status must be one of ${ORDER_STATUSES.join(', ')}` }, 'Invalid order filter');
    }
    const orders = await orderRepository.findByUserId(req.user!.userId, status as OrderStatus | undefined);
    res.json({ success: true, data: orders });
  } catch (error) {
    serverError(res, 'Get orders', error);
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order || order.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    serverError(res, 'Get order', error);
  }
};

export const getShippingOptions = async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(SHIPPING_METHODS).map(([id, method]) => ({ id, ...method }))
  });
};

export const getQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shippingMethod = req.body.shippingMethod || 'standard';
    if (!isShippingMethod(shippingMethod)) {
      return sendValidationError(res, { shippingMethod: 'Choose standard, express or overnight shipping' });
    }
    const { quote } = await buildQuote(req.user!.userId, shippingMethod);
    res.json({ success: true, data: quote });
  } catch (error) {
    serverError(res, 'Get quote', error);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { addressId, shippingAddress, saveAddress, shippingMethod, paymentMethod, cardLast4 } = req.body;

    if (!isShippingMethod(shippingMethod)) {
      return sendValidationError(res, { shippingMethod: 'Choose standard, express or overnight shipping' });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return sendValidationError(res, { paymentMethod: 'Choose card, PayPal or cash on delivery' });
    }
    if (paymentMethod === 'card' && !/^\d{4}$/.test(String(cardLast4 || ''))) {
      return sendValidationError(res, { cardLast4: 'Card details are required for card payments' });
    }

    let address;
    if (addressId) {
      const saved = await addressRepository.findById(addressId);
      if (!saved || saved.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Saved address not found' });
      }
      const { fullName, phone, street, city, state, zipCode, country } = saved;
      address = { fullName, phone, street, city, state, zipCode, country };
    } else {
      const fields = validateAddress(shippingAddress, { requireContact: true });
      if (Object.keys(fields).length) return sendValidationError(res, fields);
      address = cleanAddress(shippingAddress);
      if (saveAddress) {
        const existing = await addressRepository.findByUserId(userId);
        if (existing.length >= MAX_ADDRESSES) {
          return res.status(400).json({
            success: false,
            error: `Your address book is full (${MAX_ADDRESSES} addresses). Untick "Save this address" or remove an address in My Account.`
          });
        }
      }
    }

    const { cart, quote } = await buildQuote(userId, shippingMethod);
    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }
    for (const line of cart.items) {
      if (line.product.stock < line.quantity) {
        return res.status(400).json({
          success: false,
          error: line.product.stock === 0
            ? `${line.product.name} is out of stock. Remove it from your cart to continue.`
            : `Only ${line.product.stock} of ${line.product.name} available. Update your cart to continue.`
        });
      }
    }
    if (paymentMethod === 'cod' && quote.total > COD_LIMIT) {
      return res.status(400).json({
        success: false,
        error: `Cash on delivery is only available for orders up to $${COD_LIMIT.toFixed(2)}`
      });
    }

    if (!addressId && saveAddress) {
      await addressRepository.create({ userId, label: 'Saved at checkout', ...address });
    }

    const orderId = uuidv4();
    const now = new Date();
    const order = await orderRepository.create({
      id: orderId,
      userId,
      orderNumber: orderRepository.generateOrderNumber(),
      items: cart.items.map(line => ({
        id: uuidv4(),
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        price: line.price,
        product: line.product,
        productName: line.product.name,
        productPrice: line.price,
        subtotal: line.subtotal
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      couponCode: quote.couponCode,
      shipping: quote.shipping,
      shippingMethod,
      tax: quote.tax,
      total: quote.total,
      totalAmount: quote.total,
      status: 'pending',
      statusHistory: [{ status: 'pending', date: now, note: 'Order placed' }],
      paymentMethod,
      cardLast4: paymentMethod === 'card' ? String(cardLast4) : undefined,
      transactionId: paymentMethod === 'cod' ? undefined : `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
      estimatedDelivery: estimateDelivery(now, shippingMethod),
      shippingAddress: address
    });

    for (const line of cart.items) {
      await productRepository.update(line.productId, { stock: line.product.stock - line.quantity });
    }
    await cartRepository.deleteByUserId(userId);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    serverError(res, 'Create order', error);
  }
};

export const restockOrder = async (items: { productId: string; quantity: number }[]) => {
  for (const item of items) {
    const product = await productRepository.findById(item.productId);
    if (product) {
      await productRepository.update(item.productId, { stock: product.stock + item.quantity });
    }
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order || order.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Orders that are ${order.status} can no longer be cancelled`
      });
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length > 200) {
      return sendValidationError(res, { reason: 'Reason must be 200 characters or fewer' });
    }

    const updatedOrder = await orderRepository.update(order.id, {
      status: 'cancelled',
      cancellationReason: reason || undefined,
      statusHistory: [...order.statusHistory, { status: 'cancelled', date: new Date(), note: reason || 'Cancelled by customer' }]
    });
    await restockOrder(order.items);

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    serverError(res, 'Cancel order', error);
  }
};

export const reorder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const order = await orderRepository.findById(req.params.id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const added: { productName: string; quantity: number }[] = [];
    const skipped: { productName: string; reason: string }[] = [];
    for (const item of order.items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        skipped.push({ productName: item.productName, reason: 'No longer available' });
        continue;
      }
      const existing = await cartRepository.findByUserIdAndProductId(userId, product.id);
      const room = Math.min(product.stock, MAX_QUANTITY_PER_ITEM) - (existing?.quantity || 0);
      if (room <= 0) {
        skipped.push({ productName: product.name, reason: product.stock === 0 ? 'Out of stock' : 'Already at the maximum quantity in your cart' });
        continue;
      }
      const quantity = Math.min(item.quantity, room);
      if (existing) await cartRepository.update(existing.id, { quantity: existing.quantity + quantity });
      else await cartRepository.create({ userId, productId: product.id, quantity, price: product.price });
      added.push({ productName: product.name, quantity });
    }

    res.json({ success: true, data: { added, skipped, cart: await buildCartSummary(userId) } });
  } catch (error) {
    serverError(res, 'Reorder', error);
  }
};
