import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import Header from './components/Header';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { GlobalStyles } from './styles/GlobalStyles';
import Wishlist from './pages/Wishlist';
import CurrencyConverter from './pages/CurrencyConverter';
import CompareProducts from './pages/CompareProducts';




const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <GlobalStyles />
          <div className="App">
            <Header />
            <main>
              <Routes>
                <Route path="/" caseSensitive={false} element={<Home />} />
                <Route path="/products" caseSensitive={false} element={<Products />} />
                <Route path="/products/:id" caseSensitive={false} element={<ProductDetail />} />
                <Route path="/login" caseSensitive={false} element={<Login />} />
                <Route path="/signup" caseSensitive={false} element={<Signup />} />
                <Route path="/wishlist" caseSensitive={false} element={<Wishlist />} />
                <Route path="/currency" caseSensitive={false} element={<CurrencyConverter />} />
                <Route path="/compare" caseSensitive={false} element={<CompareProducts />} />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;