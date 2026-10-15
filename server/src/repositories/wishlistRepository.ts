import { WishlistItem } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { SEED_WISHLIST, daysBefore } from '../data/seed';
import productRepository from './productRepository';
import userRepository from './userRepository';

class WishlistRepository {
  private items: WishlistItem[] = [];

  constructor() {
    SEED_WISHLIST.forEach((seed, index) => {
      const user = userRepository.findByEmailSync(seed.email);
      const product = productRepository.findByNameSync(seed.product);
      if (user && product) {
        this.items.push({ id: uuidv4(), userId: user.id, productId: product.id, addedAt: daysBefore(10 - index) });
      }
    });
  }

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    return this.items
      .filter(item => item.userId === userId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  async find(userId: string, productId: string): Promise<WishlistItem | null> {
    return this.items.find(item => item.userId === userId && item.productId === productId) || null;
  }

  async add(userId: string, productId: string): Promise<WishlistItem> {
    const item: WishlistItem = { id: uuidv4(), userId, productId, addedAt: new Date() };
    this.items.push(item);
    return item;
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.userId === userId && item.productId === productId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  async removeProductEverywhere(productId: string): Promise<void> {
    this.items = this.items.filter(item => item.productId !== productId);
  }
}

export default new WishlistRepository();
