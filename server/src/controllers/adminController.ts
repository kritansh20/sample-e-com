import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import productRepository from '../repositories/productRepository';
import orderRepository from '../repositories/orderRepository';
import userRepository from '../repositories/userRepository';
import cartRepository from '../repositories/cartRepository';
import wishlistRepository from '../repositories/wishlistRepository';
import reviewRepository from '../repositories/reviewRepository';
import { OrderStatus, Product } from '../models';
import { restockOrder } from './orderController';
import { FieldErrors, sendValidationError } from '../utils/validation';
import { round2 } from '../services/pricing';

export const LOW_STOCK_THRESHOLD = 5;

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

const hasTwoDecimals = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

const validateProduct = async (body: any): Promise<{ errors: FieldErrors; data: Partial<Product> }> => {
  const errors: FieldErrors = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 3 || name.length > 100) errors.name = 'Name must be 3-100 characters';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length < 10 || description.length > 1000) errors.description = 'Description must be 10-1000 characters';
  const brand = typeof body.brand === 'string' ? body.brand.trim() : '';
  if (!brand) errors.brand = 'Brand is required';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const categories = await productRepository.getCategories();
  if (!categories.includes(category)) errors.category = `Category must be one of ${categories.join(', ')}`;
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 100000 || !hasTwoDecimals(price)) {
    errors.price = 'Price must be greater than 0, at most 100000, with up to 2 decimals';
  }
  let originalPrice: number | undefined;
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== '') {
    originalPrice = Number(body.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= price) {
      errors.originalPrice = 'Original price must be higher than the price';
    }
  }
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 10000) errors.stock = 'Stock must be a whole number from 0 to 10000';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  if (imageUrl && !/^https?:\/\/\S+$/.test(imageUrl)) errors.imageUrl = 'Image URL must start with http:// or https://';

  return {
    errors,
    data: {
      name,
      description,
      brand,
      category,
      price,
      originalPrice,
      stock,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
      featured: Boolean(body.featured)
    }
  };
};

export const getStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await productRepository.getAll();
    const orders = await orderRepository.findAll();
    const users = await userRepository.getAllUsers();
    const ordersByStatus: Record<OrderStatus, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(order => { ordersByStatus[order.status] += 1; });

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        totalOrders: orders.length,
        revenue: round2(orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)),
        ordersByStatus,
        totalCustomers: users.filter(u => u.role === 'customer').length
      }
    });
  } catch (error) {
    serverError(res, 'Admin stats', error);
  }
};

export const listProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const products = (await productRepository.getAll())
      .filter(p => !search || p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: products });
  } catch (error) {
    serverError(res, 'Admin list products', error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { errors, data } = await validateProduct(req.body);
    if (Object.keys(errors).length) return sendValidationError(res, errors);
    const exists = (await productRepository.getAll()).some(p => p.name.toLowerCase() === data.name!.toLowerCase());
    if (exists) return sendValidationError(res, { name: 'A product with this name already exists' });

    const product = await productRepository.create({ ...(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>), rating: 0, reviewCount: 0 });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    serverError(res, 'Admin create product', error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productRepository.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const { errors, data } = await validateProduct({ ...product, ...req.body });
    if (Object.keys(errors).length) return sendValidationError(res, errors);
    const clash = (await productRepository.getAll()).some(p => p.id !== product.id && p.name.toLowerCase() === data.name!.toLowerCase());
    if (clash) return sendValidationError(res, { name: 'A product with this name already exists' });

    const updated = await productRepository.update(product.id, data);
    res.json({ success: true, data: updated });
  } catch (error) {
    serverError(res, 'Admin update product', error);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productRepository.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    await productRepository.delete(product.id);
    await cartRepository.removeProductEverywhere(product.id);
    await wishlistRepository.removeProductEverywhere(product.id);
    await reviewRepository.deleteByProduct(product.id);
    res.json({ success: true, message: `${product.name} deleted` });
  } catch (error) {
    serverError(res, 'Admin delete product', error);
  }
};

export const listOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as OrderStatus | undefined;
    if (status && !(status in STATUS_TRANSITIONS)) {
      return sendValidationError(res, { status: `status must be one of ${Object.keys(STATUS_TRANSITIONS).join(', ')}` });
    }
    const orders = await orderRepository.findAll(status);
    const users = await userRepository.getAllUsers();
    res.json({
      success: true,
      data: orders.map(order => {
        const customer = users.find(u => u.id === order.userId);
        return {
          ...order,
          customer: customer ? { name: `${customer.firstName} ${customer.lastName}`, email: customer.email } : null,
          allowedTransitions: STATUS_TRANSITIONS[order.status]
        };
      })
    });
  } catch (error) {
    serverError(res, 'Admin list orders', error);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const status = req.body.status as OrderStatus;
    if (!(status in STATUS_TRANSITIONS)) {
      return sendValidationError(res, { status: `status must be one of ${Object.keys(STATUS_TRANSITIONS).join(', ')}` });
    }
    if (!STATUS_TRANSITIONS[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change an order from ${order.status} to ${status}`
      });
    }

    const note = typeof req.body.note === 'string' && req.body.note.trim() ? req.body.note.trim() : `Marked ${status} by admin`;
    const updated = await orderRepository.update(order.id, {
      status,
      statusHistory: [...order.statusHistory, { status, date: new Date(), note }]
    });
    if (status === 'cancelled') await restockOrder(order.items);

    res.json({ success: true, data: { ...updated, allowedTransitions: STATUS_TRANSITIONS[status] } });
  } catch (error) {
    serverError(res, 'Admin update order status', error);
  }
};
