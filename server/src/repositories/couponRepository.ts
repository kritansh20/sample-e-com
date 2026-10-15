import { Coupon } from '../models';

const COUPONS: Coupon[] = [
  { code: 'WELCOME10', description: '10% off your order', type: 'percent', value: 10, minSubtotal: 0 },
  { code: 'SAVE20', description: '$20 off orders of $150 or more', type: 'fixed', value: 20, minSubtotal: 150 },
  { code: 'FREESHIP', description: 'Free standard shipping', type: 'free_shipping', value: 0, minSubtotal: 0 },
  { code: 'BOOKS15', description: '15% off Books', type: 'percent', value: 15, minSubtotal: 0, category: 'Books' },
  { code: 'SUMMER25', description: '25% off summer sale', type: 'percent', value: 25, minSubtotal: 0, expiresAt: new Date('2026-09-01T00:00:00.000Z') },
];

class CouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    return COUPONS.find(c => c.code === normalized) || null;
  }
}

export default new CouponRepository();
