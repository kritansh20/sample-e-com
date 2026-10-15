import axios from 'axios';
import {
  User,
  Product,
  Cart,
  Order,
  AdminOrder,
  AdminStats,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  ProductsResponse,
  ProductQuery,
  CheckoutRequest,
  ReviewsResponse,
  Review,
  Wishlist,
  SavedAddress,
  AddressInput,
  ShippingOption,
  ShippingMethod,
  Quote,
  FieldErrors,
  OrderStatusValue,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginRequest && currentPath !== '/login') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const getFieldErrors = (error: unknown): FieldErrors => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { fields?: FieldErrors } | undefined;
    if (data?.fields) return data.fields;
  }
  return {};
};

class ApiClient {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', userData);
    return response.data.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  }

  async updateProfile(data: { firstName: string; lastName: string }): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/auth/password', data);
  }

  async getProducts(params?: ProductQuery): Promise<ProductsResponse> {
    const response = await api.get('/products', { params });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get('/products/featured');
    return response.data.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get('/products/categories');
    return response.data.data;
  }

  async getReviews(productId: string, sort = 'newest'): Promise<ReviewsResponse> {
    const response = await api.get(`/products/${productId}/reviews`, { params: { sort } });
    return response.data.data;
  }

  async createReview(productId: string, data: { rating: number; title: string; comment: string }): Promise<Review> {
    const response = await api.post(`/products/${productId}/reviews`, data);
    return response.data.data;
  }

  async deleteReview(productId: string, reviewId: string): Promise<void> {
    await api.delete(`/products/${productId}/reviews/${reviewId}`);
  }

  async getCart(): Promise<Cart> {
    const response = await api.get('/cart');
    return response.data.data;
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const response = await api.post('/cart', { productId, quantity });
    return response.data.data;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const response = await api.put(`/cart/${itemId}`, { quantity });
    return response.data.data;
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data.data;
  }

  async moveCartItemToWishlist(itemId: string): Promise<Cart> {
    const response = await api.post(`/cart/${itemId}/move-to-wishlist`);
    return response.data.data;
  }

  async clearCart(): Promise<Cart> {
    const response = await api.delete('/cart');
    return response.data.data;
  }

  async applyCoupon(code: string): Promise<Cart> {
    const response = await api.post('/cart/coupon', { code });
    return response.data.data;
  }

  async removeCoupon(): Promise<Cart> {
    const response = await api.delete('/cart/coupon');
    return response.data.data;
  }

  async getWishlist(): Promise<Wishlist> {
    const response = await api.get('/wishlist');
    return response.data.data;
  }

  async addToWishlist(productId: string): Promise<Wishlist> {
    const response = await api.post('/wishlist', { productId });
    return response.data.data;
  }

  async removeFromWishlist(productId: string): Promise<Wishlist> {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data.data;
  }

  async moveWishlistItemToCart(productId: string): Promise<{ wishlist: Wishlist; cart: Cart }> {
    const response = await api.post(`/wishlist/${productId}/move-to-cart`);
    return response.data.data;
  }

  async getAddresses(): Promise<SavedAddress[]> {
    const response = await api.get('/addresses');
    return response.data.data;
  }

  async createAddress(data: AddressInput & { label: string; isDefault?: boolean }): Promise<SavedAddress> {
    const response = await api.post('/addresses', data);
    return response.data.data;
  }

  async updateAddress(id: string, data: AddressInput & { label: string; isDefault?: boolean }): Promise<SavedAddress> {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data.data;
  }

  async setDefaultAddress(id: string): Promise<SavedAddress[]> {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data.data;
  }

  async deleteAddress(id: string): Promise<SavedAddress[]> {
    const response = await api.delete(`/addresses/${id}`);
    return response.data.data;
  }

  async getShippingOptions(): Promise<ShippingOption[]> {
    const response = await api.get('/orders/shipping-options');
    return response.data.data;
  }

  async getQuote(shippingMethod: ShippingMethod): Promise<Quote> {
    const response = await api.post('/orders/quote', { shippingMethod });
    return response.data.data;
  }

  async getOrders(status?: OrderStatusValue): Promise<Order[]> {
    const response = await api.get('/orders', { params: status ? { status } : undefined });
    return response.data.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  }

  async createOrder(checkoutData: CheckoutRequest): Promise<Order> {
    const response = await api.post('/orders', checkoutData);
    return response.data.data;
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  }

  async reorder(id: string): Promise<{ added: { productName: string; quantity: number }[]; skipped: { productName: string; reason: string }[]; cart: Cart }> {
    const response = await api.post(`/orders/${id}/reorder`);
    return response.data.data;
  }

  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/admin/stats');
    return response.data.data;
  }

  async getAdminProducts(search?: string): Promise<Product[]> {
    const response = await api.get('/admin/products', { params: search ? { search } : undefined });
    return response.data.data;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post('/admin/products', data);
    return response.data.data;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  }

  async getAdminOrders(status?: OrderStatusValue): Promise<AdminOrder[]> {
    const response = await api.get('/admin/orders', { params: status ? { status } : undefined });
    return response.data.data;
  }

  async updateOrderStatus(id: string, status: OrderStatusValue): Promise<AdminOrder> {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;
