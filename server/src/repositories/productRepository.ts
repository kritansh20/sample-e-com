import { Product, PaginationParams, PaginatedResponse } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { SEED_PRODUCTS, SEED_REVIEWS, daysBefore, seedId } from '../data/seed';

export type ProductSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name';

export const PRODUCT_SORTS: ProductSort[] = ['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'name'];

export interface ProductQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  sort?: ProductSort;
  page: number;
  limit: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

class ProductRepository {
  private products: Product[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.products = SEED_PRODUCTS.map((seed, index) => {
      const ratings = SEED_REVIEWS.filter(review => review.product === seed.name).map(review => review.rating);
      const createdAt = daysBefore(120 - index * 4);
      return {
        id: seedId('product', seed.name),
        ...seed,
        rating: ratings.length ? round1(ratings.reduce((sum, r) => sum + r, 0) / ratings.length) : 0,
        reviewCount: ratings.length,
        createdAt,
        updatedAt: createdAt
      };
    });
  }

  async query(q: ProductQuery): Promise<PaginatedResponse<Product>> {
    let results = this.products.slice();

    if (q.search) {
      const term = q.search.trim().toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
      );
    }
    if (q.category) {
      results = results.filter(p => p.category.toLowerCase() === q.category!.toLowerCase());
    }
    if (q.minPrice !== undefined) results = results.filter(p => p.price >= q.minPrice!);
    if (q.maxPrice !== undefined) results = results.filter(p => p.price <= q.maxPrice!);
    if (q.minRating !== undefined) results = results.filter(p => p.rating >= q.minRating!);
    if (q.inStock) results = results.filter(p => p.stock > 0);
    if (q.onSale) results = results.filter(p => p.originalPrice !== undefined && p.originalPrice > p.price);
    if (q.featured) results = results.filter(p => p.featured);

    switch (q.sort) {
      case 'price_asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    const total = results.length;
    const start = (q.page - 1) * q.limit;
    return {
      data: results.slice(start, start + q.limit),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit))
      }
    };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    return this.query({ page: params?.page ?? 1, limit: (params?.limit ?? this.products.length) || 1 });
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find(product => product.id === id) || null;
  }

  findByNameSync(name: string): Product | null {
    return this.products.find(product => product.name === name) || null;
  }

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.push(product);
    return product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.products[index];
  }

  setRatingStats(id: string, rating: number, reviewCount: number): void {
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.rating = round1(rating);
      product.reviewCount = reviewCount;
    }
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return false;

    this.products.splice(index, 1);
    return true;
  }

  async getCategories(): Promise<string[]> {
    return [...new Set(this.products.map(product => product.category))].sort();
  }

  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return this.products
      .filter(product => product.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  async getAll(): Promise<Product[]> {
    return this.products.slice();
  }
}

export default new ProductRepository();
