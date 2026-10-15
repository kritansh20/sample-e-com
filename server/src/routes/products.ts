import { Router } from 'express';
import { getProducts, getProduct, getFeaturedProducts, getCategories } from '../controllers/productController';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', authenticateToken, createReview);
router.delete('/:id/reviews/:reviewId', authenticateToken, deleteReview);

export default router;
