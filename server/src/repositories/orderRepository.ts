import { Order, OrderStatus, OrderItem, PaginatedResponse } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { SEED_ADDRESSES, SEED_ORDERS, daysBefore } from '../data/seed';
import { computeShipping, computeTax, estimateDelivery, round2 } from '../services/pricing';
import productRepository from './productRepository';
import userRepository from './userRepository';

class OrderRepository {
  private orders: Order[] = [];
  private nextOrderNumber = 1001;

  constructor() {
    this.reset();
  }

  reset() {
    this.orders = [];
    this.nextOrderNumber = 1001;
    for (const seed of SEED_ORDERS) {
      const user = userRepository.findByEmailSync(seed.email);
      if (!user) continue;
      const createdAt = daysBefore(seed.daysAgo);
      const id = uuidv4();
      const items: OrderItem[] = [];
      for (const line of seed.items) {
        const product = productRepository.findByNameSync(line.product);
        if (!product) continue;
        items.push({
          id: uuidv4(),
          orderId: id,
          productId: product.id,
          quantity: line.quantity,
          price: product.price,
          product,
          productName: product.name,
          productPrice: product.price,
          subtotal: round2(product.price * line.quantity)
        });
      }
      const subtotal = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
      const shipping = computeShipping(seed.shippingMethod, subtotal, false);
      const tax = computeTax(subtotal);
      const total = round2(subtotal + shipping + tax);
      const address = SEED_ADDRESSES.find(a => a.email === seed.email) || {
        fullName: `${user.firstName} ${user.lastName}`, phone: '', street: '12 Market Street', city: 'Austin', state: 'TX', zipCode: '73301', country: 'United States'
      };
      const history = seed.history.map((status, index) => ({
        status,
        date: new Date(createdAt.getTime() + index * 24 * 60 * 60 * 1000)
      }));
      const status = seed.history[seed.history.length - 1];
      this.orders.push({
        id,
        userId: user.id,
        orderNumber: seed.orderNumber,
        items,
        subtotal,
        discount: 0,
        shipping,
        shippingMethod: seed.shippingMethod,
        tax,
        total,
        totalAmount: total,
        status,
        statusHistory: history,
        paymentMethod: seed.paymentMethod,
        cardLast4: seed.paymentMethod === 'card' ? '4242' : undefined,
        transactionId: `TXN-${seed.orderNumber}`,
        estimatedDelivery: estimateDelivery(createdAt, seed.shippingMethod),
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country
        },
        createdAt,
        updatedAt: history[history.length - 1].date
      });
      this.nextOrderNumber = Math.max(this.nextOrderNumber, Number(seed.orderNumber.replace('ORD-', '')) + 1);
    }
  }

  generateOrderNumber(): string {
    return `ORD-${this.nextOrderNumber++}`;
  }

  async findByUserId(userId: string, status?: OrderStatus): Promise<Order[]> {
    return this.orders
      .filter(order => order.userId === userId && (!status || order.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(order => order.id === id) || null;
  }

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Order> {
    const now = new Date();
    const order: Order = {
      ...orderData,
      id: orderData.id || uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    this.orders.push(order);
    return order;
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.orders[index];
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    return this.orders
      .filter(order => !status || order.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedResponse<Order>> {
    const all = await this.findAll();
    const start = (page - 1) * limit;
    return {
      data: all.slice(start, start + limit),
      pagination: { page, limit, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / limit)) }
    };
  }

  async hasDeliveredOrderWithProduct(userId: string, productId: string): Promise<boolean> {
    return this.orders.some(order =>
      order.userId === userId &&
      order.status === 'delivered' &&
      order.items.some(item => item.productId === productId)
    );
  }
}

export default new OrderRepository();
