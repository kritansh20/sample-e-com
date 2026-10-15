import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useCompare } from '../hooks/useCompare';
import { Product } from '../types';
import { Alert, Page, Stars } from '../components/ui';
import ProductReviews from '../components/ProductReviews';
import { LOW_STOCK_THRESHOLD } from '../components/ProductCard';
import { formatCurrency } from '../utils/format';

const MAX_PER_ITEM = 10;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
`;

const Breadcrumb = styled.nav`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 16px;

  a {
    color: #007bff;
    text-decoration: none;
  }
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 12px 0;

  .price {
    font-size: 2rem;
    font-weight: 700;
    color: #28a745;
  }

  .original {
    color: #6c757d;
    text-decoration: line-through;
  }

  .save {
    color: #dc3545;
    font-weight: 600;
  }
`;

const QuantityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0;

  input {
    width: 70px;
    text-align: center;
  }

  button {
    padding: 8px 14px;
    background: #e9ecef;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [adding, setAdding] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    try {
      setProduct(await apiClient.getProduct(id));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load product'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    loadProduct();
  }, [loadProduct]);

  if (loading) {
    return <Page><div className="loading" data-testid="product-loading">Loading product...</div></Page>;
  }

  if (error || !product) {
    return (
      <Page>
        <button type="button" className="btn-outline" onClick={() => navigate('/products')} data-testid="back-to-products">← Back to products</button>
        <div style={{ textAlign: 'center', padding: 40 }} data-testid="product-not-found">
          <h2>Product not found</h2>
          <p style={{ color: '#6c757d' }}>{error}</p>
        </div>
      </Page>
    );
  }

  const maxQuantity = Math.min(product.stock, MAX_PER_ITEM);
  const onSale = product.originalPrice !== undefined && product.originalPrice > product.price;
  const inWishlist = wishlist.isInWishlist(product.id);

  const changeQuantity = (value: number) => {
    if (!Number.isInteger(value) || value < 1) {
      setQuantityError('Quantity must be at least 1');
      setQuantity(1);
      return;
    }
    if (value > maxQuantity) {
      setQuantityError(product.stock < MAX_PER_ITEM ? `Only ${product.stock} available` : `You can buy at most ${MAX_PER_ITEM} of each item`);
      setQuantity(maxQuantity);
      return;
    }
    setQuantityError(null);
    setQuantity(value);
  };

  const handleAddToCart = async () => {
    setMessage(null);
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setMessage({ text: `Added ${quantity} × ${product.name} to your cart.`, variant: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Could not add to cart', variant: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    setMessage(null);
    try {
      await wishlist.toggle(product.id);
      setMessage({ text: inWishlist ? 'Removed from your wishlist.' : 'Saved to your wishlist.', variant: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Could not update wishlist', variant: 'error' });
    }
  };

  const handleCompare = () => {
    const result = compare.toggle(product.id);
    setMessage(result.ok ? null : { text: result.message || 'Cannot compare more products', variant: 'error' });
  };

  return (
    <Page>
      <Breadcrumb aria-label="Breadcrumb" data-testid="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{' '}
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} data-testid="breadcrumb-category">{product.category}</Link> / {product.name}
      </Breadcrumb>

      <Layout>
        <Image
          src={product.imageUrl}
          alt={product.name}
          data-testid="product-detail-image"
          onError={e => {
            e.currentTarget.src = 'https://via.placeholder.com/500x400?text=No+Image';
          }}
        />

        <div>
          <div style={{ color: '#6c757d' }} data-testid="product-detail-brand">{product.brand}</div>
          <h1 data-testid="product-detail-name">{product.name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} data-testid="product-detail-rating">
            <Stars rating={product.rating} />
            <span>{product.reviewCount ? `${product.rating.toFixed(1)} (${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}</span>
          </div>
          <PriceRow>
            <span className="price" data-testid="product-detail-price">{formatCurrency(product.price)}</span>
            {onSale && (
              <>
                <span className="original" data-testid="product-detail-original-price">{formatCurrency(product.originalPrice as number)}</span>
                <span className="save" data-testid="product-detail-savings">You save {formatCurrency((product.originalPrice as number) - product.price)}</span>
              </>
            )}
          </PriceRow>
          <p data-testid="product-detail-description">{product.description}</p>
          <p
            style={{ marginTop: 12, fontWeight: 600, color: product.stock === 0 ? '#dc3545' : product.stock <= LOW_STOCK_THRESHOLD ? '#fd7e14' : '#28a745' }}
            data-testid="product-detail-stock"
          >
            {product.stock === 0 ? 'Out of stock' : product.stock <= LOW_STOCK_THRESHOLD ? `Only ${product.stock} left in stock` : 'In stock'}
          </p>

          {message && <div style={{ marginTop: 16 }}><Alert variant={message.variant} testId="product-detail-message">{message.text}</Alert></div>}

          {isAuthenticated ? (
            <>
              {product.stock > 0 && (
                <QuantityRow>
                  <label htmlFor="quantity">Quantity</label>
                  <button type="button" aria-label="Decrease quantity" data-testid="quantity-decrease" disabled={quantity <= 1} onClick={() => changeQuantity(quantity - 1)}>−</button>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    data-testid="quantity-input"
                    onChange={e => changeQuantity(parseInt(e.target.value, 10))}
                  />
                  <button type="button" aria-label="Increase quantity" data-testid="quantity-increase" disabled={quantity >= maxQuantity} onClick={() => changeQuantity(quantity + 1)}>+</button>
                </QuantityRow>
              )}
              {quantityError && <div className="error-message" role="alert" data-testid="quantity-error" style={{ marginBottom: 12 }}>{quantityError}</div>}
              <Actions>
                <button type="button" className="btn-primary" data-testid="add-to-cart-button" disabled={product.stock === 0 || adding} onClick={handleAddToCart}>
                  {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button type="button" className="btn-outline" data-testid="wishlist-toggle" aria-pressed={inWishlist} onClick={handleWishlist}>
                  {inWishlist ? '♥ In Wishlist' : '♡ Add to Wishlist'}
                </button>
                <button type="button" className="btn-secondary" data-testid="compare-toggle" aria-pressed={compare.isComparing(product.id)} onClick={handleCompare}>
                  {compare.isComparing(product.id) ? 'Remove from Compare' : 'Add to Compare'}
                </button>
              </Actions>
            </>
          ) : (
            <p style={{ marginTop: 20 }} data-testid="login-to-buy">
              <Link to="/login" state={{ from: location }}>Log in</Link> to add items to your cart or wishlist.
            </p>
          )}
        </div>
      </Layout>

      <ProductReviews productId={product.id} onStatsChange={loadProduct} />
    </Page>
  );
};

export default ProductDetail;
