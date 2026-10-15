import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import wishlistRepository from '../repositories/wishlistRepository';
import productRepository from '../repositories/productRepository';
import cartRepository from '../repositories/cartRepository';
import { buildCartSummary } from '../services/cartService';
import { MAX_QUANTITY_PER_ITEM } from '../services/pricing';

const buildWishlist = async (userId: string) => {
  const items = await wishlistRepository.findByUserId(userId);
  const result = [];
  for (const item of items) {
    const product = await productRepository.findById(item.productId);
    if (product) result.push({ id: item.id, productId: item.productId, addedAt: item.addedAt, product });
  }
  return { items: result, count: result.length };
};

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, data: await buildWishlist(req.user!.userId) });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }
    if (!(await productRepository.findById(productId))) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (await wishlistRepository.find(userId, productId)) {
      return res.status(409).json({ success: false, error: 'Product is already in your wishlist' });
    }
    await wishlistRepository.add(userId, productId);
    res.status(201).json({ success: true, data: await buildWishlist(userId) });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const removed = await wishlistRepository.remove(userId, req.params.productId);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Product is not in your wishlist' });
    }
    res.json({ success: true, data: await buildWishlist(userId) });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const moveWishlistItemToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    if (!(await wishlistRepository.find(userId, productId))) {
      return res.status(404).json({ success: false, error: 'Product is not in your wishlist' });
    }
    const product = await productRepository.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, error: `${product.name} is out of stock` });
    }
    const existing = await cartRepository.findByUserIdAndProductId(userId, productId);
    if (existing) {
      if (existing.quantity >= Math.min(product.stock, MAX_QUANTITY_PER_ITEM)) {
        return res.status(400).json({ success: false, error: 'You already have the maximum quantity of this item in your cart' });
      }
      await cartRepository.update(existing.id, { quantity: existing.quantity + 1 });
    } else {
      await cartRepository.create({ userId, productId, quantity: 1, price: product.price });
    }
    await wishlistRepository.remove(userId, productId);
    res.json({ success: true, data: { wishlist: await buildWishlist(userId), cart: await buildCartSummary(userId) } });
  } catch (error) {
    console.error('Move wishlist item error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
