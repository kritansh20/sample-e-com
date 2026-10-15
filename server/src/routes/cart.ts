import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  moveCartItemToWishlist
} from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);
router.post('/:itemId/move-to-wishlist', moveCartItemToWishlist);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

export default router;
