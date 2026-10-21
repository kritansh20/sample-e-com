import { Router } from 'express';
import userRepository, { TEST_USER_COUNT, TEST_USER_PASSWORD } from '../repositories/userRepository';
import productRepository from '../repositories/productRepository';
import reviewRepository from '../repositories/reviewRepository';
import wishlistRepository from '../repositories/wishlistRepository';
import addressRepository from '../repositories/addressRepository';
import orderRepository from '../repositories/orderRepository';
import cartRepository from '../repositories/cartRepository';

const router = Router();

router.post('/reset', (req, res) => {
  userRepository.reset();
  productRepository.reset();
  reviewRepository.reset();
  wishlistRepository.reset();
  addressRepository.reset();
  orderRepository.reset();
  cartRepository.reset();
  res.json({
    success: true,
    data: {
      testUsers: Array.from({ length: TEST_USER_COUNT }, (_, i) => `tester${i + 1}@example.com`),
      password: TEST_USER_PASSWORD
    }
  });
});

export default router;
