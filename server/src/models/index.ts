export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: Date;
}

export type CouponType = 'percent' | 'fixed' | 'free_shipping';

export interface Coupon {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  category?: string;
  expiresAt?: Date;
}

export type ShippingMethod = 'standard' | 'express' | 'overnight';

export type PaymentMethod = 'card' | 'paypal' | 'cod';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SavedAddress extends Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
  productName: string;
  productPrice: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderStatusEvent {
  status: OrderStatus;
  date: Date;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  shippingMethod: ShippingMethod;
  tax: number;
  total: number;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  transactionId?: string;
  cancellationReason?: string;
  estimatedDelivery: Date;
  shippingAddress: Address & { fullName?: string; phone?: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
