import { Router } from 'express';
import {
  getStats,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  updateOrderStatus
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/stats', getStats);
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', listOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
