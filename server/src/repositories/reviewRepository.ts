import { Review } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { SEED_REVIEWS, daysBefore } from '../data/seed';
import productRepository from './productRepository';

export type ReviewSort = 'newest' | 'highest' | 'lowest';

class ReviewRepository {
  private reviews: Review[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.reviews = [];
    for (const seed of SEED_REVIEWS) {
      const product = productRepository.findByNameSync(seed.product);
      if (!product) continue;
      this.reviews.push({
        id: uuidv4(),
        productId: product.id,
        userId: `seed-${seed.author}`,
        authorName: seed.author,
        rating: seed.rating,
        title: seed.title,
        comment: seed.comment,
        verifiedPurchase: seed.verifiedPurchase,
        createdAt: daysBefore(seed.daysAgo)
      });
    }
  }

  async findByProduct(productId: string, sort: ReviewSort = 'newest'): Promise<Review[]> {
    const list = this.reviews.filter(r => r.productId === productId);
    switch (sort) {
      case 'highest':
        return list.sort((a, b) => b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime());
      case 'lowest':
        return list.sort((a, b) => a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime());
      default:
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async findById(id: string): Promise<Review | null> {
    return this.reviews.find(r => r.id === id) || null;
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Review | null> {
    return this.reviews.find(r => r.userId === userId && r.productId === productId) || null;
  }

  async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const review: Review = { id: uuidv4(), ...data, createdAt: new Date() };
    this.reviews.push(review);
    this.refreshProductStats(data.productId);
    return review;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    const [removed] = this.reviews.splice(index, 1);
    this.refreshProductStats(removed.productId);
    return true;
  }

  async deleteByProduct(productId: string): Promise<void> {
    this.reviews = this.reviews.filter(r => r.productId !== productId);
  }

  private refreshProductStats(productId: string) {
    const ratings = this.reviews.filter(r => r.productId === productId).map(r => r.rating);
    const average = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    productRepository.setRatingStats(productId, average, ratings.length);
  }
}

export default new ReviewRepository();
