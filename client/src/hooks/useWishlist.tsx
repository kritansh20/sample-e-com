import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { Wishlist } from '../types';
import { useAuth } from './useAuth';
import { useCart } from './useCart';

interface WishlistContextType {
  wishlist: Wishlist | null;
  count: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { setCart } = useCart();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      setWishlist(await apiClient.getWishlist());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refresh().catch(() => undefined);
    else setWishlist(null);
  }, [isAuthenticated, refresh]);

  const isInWishlist = (productId: string) => Boolean(wishlist?.items.some(item => item.productId === productId));

  const guard = async <T,>(action: () => Promise<T>, fallback: string): Promise<T> => {
    if (!isAuthenticated) throw new Error('Please log in to use your wishlist');
    try {
      return await action();
    } catch (err) {
      throw new Error(getErrorMessage(err, fallback));
    }
  };

  const value: WishlistContextType = {
    wishlist,
    count: wishlist?.count || 0,
    loading,
    isInWishlist,
    toggle: async (productId) => {
      const next = await guard(
        () => (isInWishlist(productId) ? apiClient.removeFromWishlist(productId) : apiClient.addToWishlist(productId)),
        'Failed to update wishlist'
      );
      setWishlist(next);
    },
    remove: async (productId) => {
      setWishlist(await guard(() => apiClient.removeFromWishlist(productId), 'Failed to remove from wishlist'));
    },
    moveToCart: async (productId) => {
      const result = await guard(() => apiClient.moveWishlistItemToCart(productId), 'Failed to move item to cart');
      setWishlist(result.wishlist);
      setCart(result.cart);
    },
    refresh,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
