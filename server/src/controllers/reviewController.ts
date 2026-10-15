import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import productRepository from '../repositories/productRepository';
import reviewRepository, { ReviewSort } from '../repositories/reviewRepository';
import userRepository from '../repositories/userRepository';
import orderRepository from '../repositories/orderRepository';
import { FieldErrors, sendValidationError } from '../utils/validation';

const REVIEW_SORTS: ReviewSort[] = ['newest', 'highest', 'lowest'];

export const getReviews = async (req: Request, res: Response) => {
  try {
    const product = await productRepository.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const sort = (req.query.sort as string) || 'newest';
    if (!REVIEW_SORTS.includes(sort as ReviewSort)) {
      return sendValidationError(res, { sort: `sort must be one of ${REVIEW_SORTS.join(', ')}` }, 'Invalid review sort');
    }
    const reviews = await reviewRepository.findByProduct(product.id, sort as ReviewSort);
    const distribution: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    reviews.forEach(r => { distribution[String(r.rating)] += 1; });

    res.json({
      success: true,
      data: {
        reviews,
        summary: { average: product.rating, count: product.reviewCount, distribution }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const product = await productRepository.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { rating, title, comment } = req.body;
    const errors: FieldErrors = {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose a rating from 1 to 5 stars';
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (cleanTitle.length < 3 || cleanTitle.length > 80) errors.title = 'Title must be 3-80 characters';
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (cleanComment.length < 10 || cleanComment.length > 1000) errors.comment = 'Review must be 10-1000 characters';
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    if (await reviewRepository.findByUserAndProduct(userId, product.id)) {
      return res.status(409).json({ success: false, error: 'You have already reviewed this product' });
    }

    const user = await userRepository.findById(userId);
    const review = await reviewRepository.create({
      productId: product.id,
      userId,
      authorName: user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Customer',
      rating,
      title: cleanTitle,
      comment: cleanComment,
      verifiedPurchase: await orderRepository.hasDeliveredOrderWithProduct(userId, product.id)
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const review = await reviewRepository.findById(req.params.reviewId);
    if (!review || review.productId !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    const user = await userRepository.findById(req.user!.userId);
    if (!user || (review.userId !== user.id && user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'You can only delete your own reviews' });
    }
    await reviewRepository.delete(review.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
