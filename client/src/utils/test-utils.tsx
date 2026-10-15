import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

export const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

export const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  price: 29.99,
  imageUrl: 'test.jpg',
  category: 'Electronics',
  description: 'A test product',
  stock: 10,
  rating: 4.5,
  reviewCount: 123,
};

export const mockCartItem = {
  id: 'item-1',
  productId: 'product-1',
  name: 'Test Product',
  price: 29.99,
  quantity: 2,
  imageUrl: 'test.jpg',
};
