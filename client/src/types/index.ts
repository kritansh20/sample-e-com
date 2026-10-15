export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  category: string;
  imageUrl?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  type: 'percent' | 'fixed' | 'free_shipping';
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  coupon: AppliedCoupon | null;
  couponMessage?: string;
  totalPrice: number;
  totalAmount: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatusValue = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingMethod = 'standard' | 'express' | 'overnight';
export type PaymentMethod = 'card' | 'paypal' | 'cod';

export interface OrderStatusEvent {
  status: OrderStatusValue;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatusValue;
  statusHistory: OrderStatusEvent[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  shippingMethod: ShippingMethod;
  tax: number;
  total: number;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: Address & { fullName?: string; phone?: string };
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  transactionId?: string;
  cancellationReason?: string;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder extends Order {
  customer: { name: string; email: string } | null;
  allowedTransitions: OrderStatusValue[];
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

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressInput extends Address {
  fullName: string;
  phone: string;
}

export interface SavedAddress extends AddressInput {
  id: string;
  label: string;
  isDefault: boolean;
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
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: { average: number; count: number; distribution: Record<string, number> };
}

export interface WishlistEntry {
  id: string;
  productId: string;
  addedAt: string;
  product: Product;
}

export interface Wishlist {
  items: WishlistEntry[];
  count: number;
}

export interface ShippingOption {
  id: ShippingMethod;
  label: string;
  price: number;
  days: number;
}

export interface Quote {
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingMethod: ShippingMethod;
  shipping: number;
  tax: number;
  total: number;
}

export interface AdminStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalOrders: number;
  revenue: number;
  ordersByStatus: Record<OrderStatusValue, number>;
  totalCustomers: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type LoginCredentials = LoginRequest;
export type SignupData = SignupRequest;

export interface ProductsResponse {
  data: {
    data: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: string;
}

export interface CheckoutRequest {
  addressId?: string;
  shippingAddress?: AddressInput;
  saveAddress?: boolean;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export type FieldErrors = Record<string, string>;
