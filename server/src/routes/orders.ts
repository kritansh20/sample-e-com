import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  getQuote,
  getShippingOptions,
  reorder
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/shipping-options', getShippingOptions);
router.post('/quote', getQuote);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorder);

export default router;
