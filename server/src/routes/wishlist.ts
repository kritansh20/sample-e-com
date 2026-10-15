import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, moveWishlistItemToCart } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/:productId/move-to-cart', moveWishlistItemToCart);
router.delete('/:productId', removeFromWishlist);

export default router;
