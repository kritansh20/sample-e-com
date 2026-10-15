import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage, getFieldErrors } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { FieldErrors, ReviewsResponse } from '../types';
import { Alert, FieldError, Stars } from './ui';
import { formatDate } from '../utils/format';

const Section = styled.section`
  margin-top: 40px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  margin-bottom: 4px;

  .track {
    width: 160px;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: #ffc107;
  }
`;

const ReviewItem = styled.article`
  border-top: 1px solid #e9ecef;
  padding: 16px 0;

  h4 {
    margin: 4px 0;
  }

  .meta {
    color: #6c757d;
    font-size: 0.85rem;
  }
`;

const Verified = styled.span`
  background: #d4edda;
  color: #155724;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
`;

const StarPicker = styled.div`
  display: flex;
  gap: 4px;

  button {
    padding: 0 4px;
    background: transparent;
    font-size: 28px;
    line-height: 1;
  }
`;

const ProductReviews: React.FC<{ productId: string; onStatsChange: () => void }> = ({ productId, onStatsChange }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await apiClient.getReviews(productId, sort));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reviews'));
    }
  }, [productId, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const ownReview = data?.reviews.find(r => r.userId === user?.id);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (rating < 1) errors.rating = 'Choose a rating from 1 to 5 stars';
    if (title.trim().length < 3 || title.trim().length > 80) errors.title = 'Title must be 3-80 characters';
    if (comment.trim().length < 10 || comment.trim().length > 1000) errors.comment = 'Review must be 10-1000 characters';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      await apiClient.createReview(productId, { rating, title: title.trim(), comment: comment.trim() });
      setRating(0);
      setTitle('');
      setComment('');
      setSuccess('Thanks! Your review has been posted.');
      await load();
      onStatsChange();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not post your review'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await apiClient.deleteReview(productId, reviewId);
      setSuccess('Your review was deleted.');
      await load();
      onStatsChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the review'));
    }
  };

  const count = data?.summary.count || 0;

  return (
    <Section aria-labelledby="reviews-heading" data-testid="reviews-section">
      <h2 id="reviews-heading" style={{ marginBottom: 16 }}>Customer Reviews</h2>
      {error && <Alert variant="error" testId="reviews-error">{error}</Alert>}
      {data && (
        <SummaryRow>
          <div data-testid="reviews-summary">
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }} data-testid="reviews-average">
              {count ? data.summary.average.toFixed(1) : '–'}
            </div>
            <Stars rating={data.summary.average} />
            <div data-testid="reviews-count">{count} {count === 1 ? 'review' : 'reviews'}</div>
          </div>
          <div data-testid="rating-distribution">
            {['5', '4', '3', '2', '1'].map(star => (
              <Bar key={star} data-testid={`rating-bar-${star}`}>
                <span>{star}★</span>
                <div className="track">
                  <div className="fill" style={{ width: count ? `${(data.summary.distribution[star] / count) * 100}%` : 0 }} />
                </div>
                <span>{data.summary.distribution[star]}</span>
              </Bar>
            ))}
          </div>
        </SummaryRow>
      )}

      {success && <Alert variant="success" testId="review-success">{success}</Alert>}

      {!isAuthenticated ? (
        <p data-testid="review-login-prompt">
          <Link to="/login" state={{ from: location }}>Log in</Link> to write a review.
        </p>
      ) : ownReview ? (
        <p data-testid="already-reviewed">You have reviewed this product.</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate data-testid="review-form" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Write a review</h3>
          {formError && <Alert variant="error" testId="review-form-error">{formError}</Alert>}
          <div className="form-group">
            <span className="form-label" id="rating-label">Your rating</span>
            <StarPicker role="radiogroup" aria-labelledby="rating-label" data-testid="review-rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  data-testid={`review-star-${n}`}
                  style={{ color: n <= rating ? '#ffc107' : '#ccc' }}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </StarPicker>
            <FieldError message={fieldErrors.rating} testId="review-rating-error" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="review-title">Title</label>
            <input id="review-title" value={title} maxLength={80} data-testid="review-title-input" onChange={e => setTitle(e.target.value)} />
            <FieldError message={fieldErrors.title} testId="review-title-error" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="review-comment">Review</label>
            <textarea id="review-comment" rows={4} value={comment} maxLength={1000} data-testid="review-comment-input" onChange={e => setComment(e.target.value)} />
            <div style={{ fontSize: '0.8rem', color: '#6c757d' }} data-testid="review-comment-count">{comment.length}/1000</div>
            <FieldError message={fieldErrors.comment} testId="review-comment-error" />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting} data-testid="review-submit-button">
            {submitting ? 'Posting...' : 'Post review'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <label>
          Sort reviews{' '}
          <select style={{ width: 'auto' }} value={sort} data-testid="review-sort-select" onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </label>
      </div>

      {data && data.reviews.length === 0 && <p data-testid="no-reviews">No reviews yet. Be the first to review this product.</p>}
      <div data-testid="review-list">
        {data?.reviews.map(review => (
          <ReviewItem key={review.id} data-testid="review-item" data-review-id={review.id}>
            <Stars rating={review.rating} testId="review-item-rating" />
            <h4 data-testid="review-item-title">{review.title}</h4>
            <div className="meta">
              <span data-testid="review-item-author">{review.authorName}</span> · {formatDate(review.createdAt)}
              {review.verifiedPurchase && <Verified data-testid="verified-badge">Verified purchase</Verified>}
            </div>
            <p style={{ marginTop: 8 }} data-testid="review-item-comment">{review.comment}</p>
            {(review.userId === user?.id || user?.role === 'admin') && (
              <button type="button" className="btn-outline" style={{ marginTop: 8, padding: '6px 12px' }} data-testid="delete-review-button" onClick={() => handleDelete(review.id)}>
                Delete
              </button>
            )}
          </ReviewItem>
        ))}
      </div>
    </Section>
  );
};

export default ProductReviews;
