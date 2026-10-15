import { CartItem } from '../models';
import { v4 as uuidv4 } from 'uuid';

class CartRepository {
  private cartItems: CartItem[] = [];
  private coupons = new Map<string, string>();

  async findByUserId(userId: string): Promise<CartItem[]> {
    return this.cartItems
      .filter(item => item.userId === userId)
      .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());
  }

  async findByUserIdAndProductId(userId: string, productId: string): Promise<CartItem | null> {
    return this.cartItems.find(item =>
      item.userId === userId && item.productId === productId
    ) || null;
  }

  async create(cartData: Omit<CartItem, 'id' | 'addedAt'>): Promise<CartItem> {
    const cartItem: CartItem = {
      id: uuidv4(),
      ...cartData,
      addedAt: new Date()
    };
    this.cartItems.push(cartItem);
    return cartItem;
  }

  async update(id: string, updates: Partial<CartItem>): Promise<CartItem | null> {
    const index = this.cartItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.cartItems[index] = {
      ...this.cartItems[index],
      ...updates
    };
    return this.cartItems[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.cartItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.cartItems.splice(index, 1);
    return true;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
    this.coupons.delete(userId);
    return this.cartItems.length < initialLength;
  }

  async deleteByUserIdAndProductId(userId: string, productId: string): Promise<boolean> {
    const index = this.cartItems.findIndex(item =>
      item.userId === userId && item.productId === productId
    );
    if (index === -1) return false;

    this.cartItems.splice(index, 1);
    return true;
  }

  async removeProductEverywhere(productId: string): Promise<void> {
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);
  }

  async findById(id: string): Promise<CartItem | null> {
    return this.cartItems.find(item => item.id === id) || null;
  }

  getCoupon(userId: string): string | undefined {
    return this.coupons.get(userId);
  }

  setCoupon(userId: string, code: string): void {
    this.coupons.set(userId, code);
  }

  clearCoupon(userId: string): void {
    this.coupons.delete(userId);
  }
}

export default new CartRepository();
