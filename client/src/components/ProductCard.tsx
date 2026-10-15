import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useCompare } from '../hooks/useCompare';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

export const LOW_STOCK_THRESHOLD = 5;

const Card = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 14px;
`;

const SaleBadge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  background: #dc3545;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
`;

const WishlistButton = styled.button<{ $active: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 50%;
  background: #fff;
  color: ${p => (p.$active ? '#dc3545' : '#999')};
  font-size: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
`;

const CardContent = styled.div`
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProductTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
  line-height: 1.4;
`;

const Meta = styled.span`
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: block;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const Price = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #28a745;
`;

const OriginalPrice = styled.span`
  font-size: 1rem;
  color: #6c757d;
  text-decoration: line-through;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
  color: #6c757d;
  font-size: 0.9rem;
`;

const StockStatus = styled.span<{ $tone: 'ok' | 'low' | 'out' }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${p => (p.$tone === 'ok' ? '#28a745' : p.$tone === 'low' ? '#fd7e14' : '#dc3545')};
  margin-bottom: 12px;
  display: block;
`;

const CompareLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  margin-bottom: 12px;
  cursor: pointer;

  input {
    width: auto;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
`;

const AddToCartButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: white;
  padding: 12px 16px;
  border-radius: 5px;
  font-weight: 600;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
  }
`;

const ViewDetailsButton = styled(Link)`
  flex: 1;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 5px;
  font-weight: 600;
  text-align: center;

  &:hover {
    background-color: #218838;
  }
`;

const Feedback = styled.div<{ $error: boolean }>`
  font-size: 0.85rem;
  margin-top: 8px;
  color: ${p => (p.$error ? '#dc3545' : '#28a745')};
`;

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= LOW_STOCK_THRESHOLD;
  const onSale = product.originalPrice !== undefined && product.originalPrice > product.price;
  const inWishlist = wishlist.isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (isOutOfStock || isAddingToCart) return;
    setFeedback(null);
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, 1);
      setFeedback({ text: 'Added to cart', error: false });
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : 'Could not add to cart', error: true });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    setFeedback(null);
    try {
      await wishlist.toggle(product.id);
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : 'Could not update wishlist', error: true });
    }
  };

  const handleCompare = () => {
    const result = compare.toggle(product.id);
    setFeedback(result.ok ? null : { text: result.message || 'Cannot compare more products', error: true });
  };

  return (
    <Card data-testid="product-card" data-product-id={product.id}>
      <ImageContainer>
        {imageError ? (
          <ImagePlaceholder>No Image Available</ImagePlaceholder>
        ) : (
          <ProductImage
            src={product.imageUrl || 'https://via.placeholder.com/300x250?text=No+Image'}
            alt={product.name}
            onError={() => setImageError(true)}
            data-testid="product-image"
          />
        )}
        {onSale && (
          <SaleBadge data-testid="sale-badge">
            -{Math.round((1 - product.price / (product.originalPrice as number)) * 100)}%
          </SaleBadge>
        )}
        {isAuthenticated && (
          <WishlistButton
            type="button"
            $active={inWishlist}
            data-testid="wishlist-toggle"
            aria-pressed={inWishlist}
            aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={handleWishlist}
          >
            {inWishlist ? '♥' : '♡'}
          </WishlistButton>
        )}
      </ImageContainer>

      <CardContent>
        <ProductTitle data-testid="product-name">{product.name}</ProductTitle>
        <Meta>
          <span data-testid="product-brand">{product.brand}</span> · <span data-testid="product-category">{product.category}</span>
        </Meta>

        <PriceContainer>
          <Price data-testid="product-price" data-price={product.price}>
            {formatCurrency(product.price)}
          </Price>
          {onSale && (
            <OriginalPrice data-testid="original-price">{formatCurrency(product.originalPrice as number)}</OriginalPrice>
          )}
        </PriceContainer>

        <RatingContainer data-testid="product-rating" data-rating={product.rating}>
          {product.reviewCount > 0 ? (
            <>
              <span style={{ color: '#ffc107' }}>★</span>
              <span>{product.rating.toFixed(1)}</span>
              <span data-testid="review-count">({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
            </>
          ) : (
            <span data-testid="review-count">No reviews yet</span>
          )}
        </RatingContainer>

        <StockStatus
          $tone={isOutOfStock ? 'out' : isLowStock ? 'low' : 'ok'}
          data-testid="stock-status"
          data-stock={product.stock}
        >
          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left` : 'In stock'}
        </StockStatus>

        <CompareLabel>
          <input
            type="checkbox"
            data-testid="compare-toggle"
            checked={compare.isComparing(product.id)}
            onChange={handleCompare}
          />
          Compare
        </CompareLabel>

        <ButtonContainer>
          {isAuthenticated && (
            <AddToCartButton
              type="button"
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              aria-label={`Add ${product.name} to cart`}
            >
              {isOutOfStock ? 'Out of Stock' : isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </AddToCartButton>
          )}

          <ViewDetailsButton
            to={`/products/${product.id}`}
            data-testid="view-details-button"
            aria-label={`View details for ${product.name}`}
          >
            View Details
          </ViewDetailsButton>
        </ButtonContainer>
        {feedback && (
          <Feedback $error={feedback.error} role={feedback.error ? 'alert' : 'status'} data-testid="product-card-feedback">
            {feedback.text}
          </Feedback>
        )}
      </CardContent>
    </Card>
  );
};
