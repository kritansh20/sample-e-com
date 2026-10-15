import { Request, Response } from 'express';
import productRepository, { PRODUCT_SORTS, ProductSort } from '../repositories/productRepository';
import { FieldErrors, sendValidationError } from '../utils/validation';

const parseNumber = (value: unknown): number | undefined | null => {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const errors: FieldErrors = {};
    const page = parseNumber(req.query.page) ?? 1;
    const limit = parseNumber(req.query.limit) ?? 12;
    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    const minRating = parseNumber(req.query.minRating);
    const sort = (req.query.sort as string | undefined) || 'relevance';

    if (page === null || !Number.isInteger(page) || page < 1) errors.page = 'page must be a whole number of 1 or more';
    if (limit === null || !Number.isInteger(limit) || limit < 1 || limit > 50) errors.limit = 'limit must be a whole number from 1 to 50';
    if (minPrice === null || (minPrice !== undefined && minPrice < 0)) errors.minPrice = 'minPrice must be 0 or more';
    if (maxPrice === null || (maxPrice !== undefined && maxPrice < 0)) errors.maxPrice = 'maxPrice must be 0 or more';
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) errors.minPrice = 'minPrice cannot be greater than maxPrice';
    if (minRating === null || (minRating !== undefined && (minRating < 0 || minRating > 5))) errors.minRating = 'minRating must be between 0 and 5';
    if (!PRODUCT_SORTS.includes(sort as ProductSort)) errors.sort = `sort must be one of ${PRODUCT_SORTS.join(', ')}`;
    if (Object.keys(errors).length) return sendValidationError(res, errors, 'Invalid product filters');

    const result = await productRepository.query({
      search: (req.query.search as string) || undefined,
      category: (req.query.category as string) || undefined,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      minRating: minRating ?? undefined,
      inStock: req.query.inStock === 'true',
      onSale: req.query.onSale === 'true',
      featured: req.query.featured === 'true',
      sort: sort as ProductSort,
      page: page as number,
      limit: limit as number
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 4 } = req.query;
    const products = await productRepository.getFeaturedProducts(parseInt(limit as string) || 4);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await productRepository.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
