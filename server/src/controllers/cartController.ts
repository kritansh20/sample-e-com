import { Response } from 'express';
import cartRepository from '../repositories/cartRepository';
import productRepository from '../repositories/productRepository';
import couponRepository from '../repositories/couponRepository';
import wishlistRepository from '../repositories/wishlistRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { buildCartSummary, CouponError, evaluateCoupon } from '../services/cartService';
import { MAX_QUANTITY_PER_ITEM } from '../services/pricing';
import { isPositiveInteger } from '../utils/validation';

const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

const quantityLimit = (stock: number) => Math.min(stock, MAX_QUANTITY_PER_ITEM);

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, data: await buildCartSummary(req.user!.userId) });
  } catch (error) {
    serverError(res, 'Get cart', error);
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;

    if (!productId || !isPositiveInteger(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and a whole-number quantity of 1 or more are required'
      });
    }

    const product = await productRepository.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, error: `${product.name} is out of stock` });
    }

    const existingItem = await cartRepository.findByUserIdAndProductId(userId, productId);
    const newQuantity = (existingItem?.quantity || 0) + quantity;
    const limit = quantityLimit(product.stock);
    if (newQuantity > limit) {
      return res.status(400).json({
        success: false,
        error: product.stock < MAX_QUANTITY_PER_ITEM
          ? `Only ${product.stock} of ${product.name} available`
          : `You can buy at most ${MAX_QUANTITY_PER_ITEM} of each item`
      });
    }

    if (existingItem) {
      await cartRepository.update(existingItem.id, { quantity: newQuantity });
    } else {
      await cartRepository.create({ userId, productId, quantity, price: product.price });
    }

    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Add to cart', error);
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!isPositiveInteger(quantity)) {
      return res.status(400).json({ success: false, error: 'Quantity must be a whole number of 1 or more' });
    }

    const cartItem = await cartRepository.findById(itemId);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    const product = await productRepository.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (quantity > quantityLimit(product.stock)) {
      return res.status(400).json({
        success: false,
        error: product.stock < MAX_QUANTITY_PER_ITEM
          ? `Only ${product.stock} of ${product.name} available`
          : `You can buy at most ${MAX_QUANTITY_PER_ITEM} of each item`
      });
    }

    await cartRepository.update(itemId, { quantity });
    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Update cart item', error);
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cartItem = await cartRepository.findById(req.params.itemId);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    await cartRepository.delete(cartItem.id);
    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Remove from cart', error);
  }
};

export const moveCartItemToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cartItem = await cartRepository.findById(req.params.itemId);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }
    if (!(await wishlistRepository.find(userId, cartItem.productId))) {
      await wishlistRepository.add(userId, cartItem.productId);
    }
    await cartRepository.delete(cartItem.id);
    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Move cart item to wishlist', error);
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    await cartRepository.deleteByUserId(userId);
    res.json({ success: true, message: 'Cart cleared successfully', data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Clear cart', error);
  }
};

export const applyCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    if (!code) {
      return res.status(400).json({ success: false, error: 'Enter a coupon code' });
    }
    const summary = await buildCartSummary(userId);
    if (summary.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Add items to your cart before applying a coupon' });
    }
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    }
    if (summary.coupon?.code === coupon.code) {
      return res.status(409).json({ success: false, error: 'This coupon is already applied' });
    }
    try {
      evaluateCoupon(coupon, summary.items);
    } catch (error) {
      if (error instanceof CouponError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      throw error;
    }
    cartRepository.setCoupon(userId, coupon.code);
    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Apply coupon', error);
  }
};

export const removeCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    cartRepository.clearCoupon(userId);
    res.json({ success: true, data: await buildCartSummary(userId) });
  } catch (error) {
    serverError(res, 'Remove coupon', error);
  }
};
