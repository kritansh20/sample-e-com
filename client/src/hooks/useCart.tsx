import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { Cart } from '../types';
import { useAuth } from './useAuth';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  moveToWishlist: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
  setCart: (cart: Cart) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      setCart(await apiClient.getCart());
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load cart'));
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
      setLoaded(false);
    }
  }, [isAuthenticated, refreshCart]);

  const run = async (action: () => Promise<Cart>, fallback: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to manage your cart');
    }
    try {
      setIsLoading(true);
      setError(null);
      setCart(await action());
    } catch (err) {
      const message = getErrorMessage(err, fallback);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    isLoading,
    loading: isLoading,
    loaded,
    error,
    addToCart: (productId, quantity) => run(() => apiClient.addToCart(productId, quantity), 'Failed to add item to cart'),
    updateQuantity: (itemId, quantity) => run(() => apiClient.updateCartItem(itemId, quantity), 'Failed to update quantity'),
    updateCartItem: (itemId, quantity) => run(() => apiClient.updateCartItem(itemId, quantity), 'Failed to update quantity'),
    removeFromCart: (itemId) => run(() => apiClient.removeFromCart(itemId), 'Failed to remove item'),
    moveToWishlist: (itemId) => run(() => apiClient.moveCartItemToWishlist(itemId), 'Failed to move item to wishlist'),
    clearCart: () => run(() => apiClient.clearCart(), 'Failed to clear cart'),
    applyCoupon: (code) => run(() => apiClient.applyCoupon(code), 'Failed to apply coupon'),
    removeCoupon: () => run(() => apiClient.removeCoupon(), 'Failed to remove coupon'),
    refreshCart,
    setCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
