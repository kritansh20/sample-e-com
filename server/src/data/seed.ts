import { OrderStatus, PaymentMethod, ShippingMethod } from '../models';

export interface SeedProduct {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  featured: boolean;
  imageUrl: string;
}

const img = (photoId: string) => `https://images.unsplash.com/${photoId}?w=400`;

export const SEED_PRODUCTS: SeedProduct[] = [
  { name: 'MacBook Pro 16"', brand: 'Apple', category: 'Electronics', price: 2499.99, stock: 10, featured: true,
    description: 'Apple MacBook Pro 16-inch with M2 Pro chip, 16GB RAM and a 512GB SSD.', imageUrl: img('photo-1517336714731-489689fd1ca8') },
  { name: 'iPhone 15 Pro', brand: 'Apple', category: 'Electronics', price: 999.99, originalPrice: 1099.99, stock: 25, featured: true,
    description: 'iPhone 15 Pro with the A17 Pro chip, 128GB storage and a titanium design.', imageUrl: img('photo-1592750475338-74b7b21085ab') },
  { name: 'Samsung 4K Smart TV 55"', brand: 'Samsung', category: 'Electronics', price: 799.99, stock: 15, featured: false,
    description: '55-inch 4K UHD smart TV with HDR and built-in streaming apps.', imageUrl: img('photo-1593359677879-a4bb92f829d1') },
  { name: 'Sony WH-1000XM5 Headphones', brand: 'Sony', category: 'Electronics', price: 349.99, originalPrice: 399.99, stock: 3, featured: true,
    description: 'Wireless noise-cancelling over-ear headphones with 30-hour battery life.', imageUrl: img('photo-1505740420928-5e560c06d30e') },
  { name: 'Kindle Paperwhite', brand: 'Amazon', category: 'Electronics', price: 139.99, stock: 0, featured: false,
    description: '6.8-inch glare-free e-reader with adjustable warm light and weeks of battery.', imageUrl: img('photo-1592496431122-2349e0fbc666') },
  { name: 'Logitech MX Master 3S Mouse', brand: 'Logitech', category: 'Electronics', price: 99.99, stock: 60, featured: false,
    description: 'Ergonomic wireless mouse with quiet clicks and an 8K DPI sensor.', imageUrl: img('photo-1527864550417-7fd91fc51a46') },
  { name: 'Nike Air Max 270', brand: 'Nike', category: 'Footwear', price: 149.99, stock: 50, featured: false,
    description: 'Lifestyle running shoes with a large Air Max heel unit for all-day comfort.', imageUrl: img('photo-1542291026-7eec264c27ff') },
  { name: 'Adidas Ultraboost 22', brand: 'Adidas', category: 'Footwear', price: 189.99, originalPrice: 219.99, stock: 40, featured: true,
    description: 'Premium running shoes with a responsive Boost midsole.', imageUrl: img('photo-1606107557195-0e29a4b5b4aa') },
  { name: 'Converse Chuck Taylor All Star', brand: 'Converse', category: 'Footwear', price: 59.99, stock: 80, featured: false,
    description: 'Classic high-top canvas sneakers.', imageUrl: img('photo-1607522370275-f14206abe5d3') },
  { name: 'Timberland 6-Inch Premium Boot', brand: 'Timberland', category: 'Footwear', price: 198.0, stock: 2, featured: false,
    description: 'Waterproof leather boots with a padded collar.', imageUrl: img('photo-1520639888713-7851133b1ed0') },
  { name: "Levi's 501 Jeans", brand: "Levi's", category: 'Clothing', price: 89.99, stock: 75, featured: false,
    description: 'Classic straight-fit jeans made from premium denim.', imageUrl: img('photo-1542272604-787c3835535d') },
  { name: 'Patagonia Better Sweater Jacket', brand: 'Patagonia', category: 'Clothing', price: 139.0, originalPrice: 159.0, stock: 20, featured: false,
    description: 'Warm fleece jacket made with recycled polyester.', imageUrl: img('photo-1551028719-00167b16eac5') },
  { name: 'Uniqlo Supima Cotton T-Shirt', brand: 'Uniqlo', category: 'Clothing', price: 14.9, stock: 150, featured: false,
    description: 'Soft crew-neck T-shirt in 100% Supima cotton.', imageUrl: img('photo-1521572163474-6864f9cf17ab') },
  { name: 'The North Face Thermoball Vest', brand: 'The North Face', category: 'Clothing', price: 119.99, stock: 12, featured: false,
    description: 'Lightweight insulated vest that packs into its own pocket.', imageUrl: img('photo-1544022613-e87ca75a784a') },
  { name: 'The Great Gatsby', brand: 'Scribner', category: 'Books', price: 12.99, stock: 100, featured: false,
    description: 'Classic novel by F. Scott Fitzgerald, paperback edition.', imageUrl: img('photo-1544947950-fa07a98d237f') },
  { name: 'Coffee Table Book: Nature Photography', brand: 'Taschen', category: 'Books', price: 39.99, stock: 30, featured: false,
    description: 'A collection of nature photographs from around the world.', imageUrl: img('photo-1481627834876-b7833e8f5570') },
  { name: 'Atomic Habits', brand: 'Avery', category: 'Books', price: 16.99, originalPrice: 27.0, stock: 45, featured: true,
    description: 'James Clear on building good habits and breaking bad ones.', imageUrl: img('photo-1589829085413-56de8ae18c73') },
  { name: 'The Pragmatic Programmer', brand: 'Addison-Wesley', category: 'Books', price: 49.99, stock: 18, featured: false,
    description: '20th anniversary edition of the classic software engineering book.', imageUrl: img('photo-1532012197267-da84d127e765') },
  { name: 'Instant Pot Duo 7-in-1', brand: 'Instant Pot', category: 'Home & Kitchen', price: 89.99, originalPrice: 99.99, stock: 35, featured: false,
    description: '6-quart electric pressure cooker, slow cooker, rice cooker and steamer.', imageUrl: img('photo-1585515320310-259814833e62') },
  { name: 'Dyson V11 Cordless Vacuum', brand: 'Dyson', category: 'Home & Kitchen', price: 599.99, stock: 8, featured: false,
    description: 'Cordless stick vacuum with up to 60 minutes of run time.', imageUrl: img('photo-1558317374-067fb5f30001') },
  { name: 'Nespresso Vertuo Coffee Maker', brand: 'Nespresso', category: 'Home & Kitchen', price: 179.0, stock: 0, featured: false,
    description: 'Single-serve coffee and espresso machine with a milk frother.', imageUrl: img('photo-1517668808822-9ebb02f2a0e6') },
  { name: 'Premium Yoga Mat 6mm', brand: 'Gaiam', category: 'Sports', price: 29.99, stock: 90, featured: false,
    description: 'Non-slip 6mm yoga mat with a carrying strap.', imageUrl: img('photo-1592432678016-e910b452f9a2') },
  { name: 'Adjustable Dumbbells 52.5 lb', brand: 'Bowflex', category: 'Sports', price: 429.0, stock: 5, featured: false,
    description: 'A pair of dumbbells that adjust from 5 to 52.5 lb.', imageUrl: img('photo-1584735935682-2f2b69dff9d2') },
  { name: 'Hydro Flask 32 oz Water Bottle', brand: 'Hydro Flask', category: 'Sports', price: 44.95, stock: 120, featured: false,
    description: 'Insulated stainless steel bottle that keeps drinks cold for 24 hours.', imageUrl: img('photo-1602143407151-7111542de6e8') },
];

export interface SeedReview {
  product: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  daysAgo: number;
  verifiedPurchase: boolean;
}

export const SEED_REVIEWS: SeedReview[] = [
  { product: 'MacBook Pro 16"', author: 'Priya S.', rating: 5, title: 'Fastest laptop I have owned', comment: 'Compiles our whole project in half the time of my old machine.', daysAgo: 40, verifiedPurchase: true },
  { product: 'MacBook Pro 16"', author: 'Marcus L.', rating: 4, title: 'Great but heavy', comment: 'Excellent screen and battery, but it is heavy to carry every day.', daysAgo: 25, verifiedPurchase: true },
  { product: 'iPhone 15 Pro', author: 'Elena R.', rating: 5, title: 'Camera is superb', comment: 'Low-light photos are much better than on my previous phone.', daysAgo: 30, verifiedPurchase: true },
  { product: 'iPhone 15 Pro', author: 'Tom H.', rating: 3, title: 'Good, not a big upgrade', comment: 'Nice phone, but not much different from the 14 Pro for daily use.', daysAgo: 12, verifiedPurchase: false },
  { product: 'Sony WH-1000XM5 Headphones', author: 'Aisha K.', rating: 5, title: 'Noise cancelling is unreal', comment: 'Flights are silent now. Comfortable for hours.', daysAgo: 18, verifiedPurchase: true },
  { product: 'Sony WH-1000XM5 Headphones', author: 'Ben W.', rating: 4, title: 'Great sound', comment: 'Sound is excellent, the case is larger than the previous model.', daysAgo: 9, verifiedPurchase: true },
  { product: 'Sony WH-1000XM5 Headphones', author: 'Chen Y.', rating: 5, title: 'Worth it', comment: 'Battery lasts all week for my commute.', daysAgo: 3, verifiedPurchase: false },
  { product: 'Kindle Paperwhite', author: 'Nora D.', rating: 4, title: 'Easy on the eyes', comment: 'Warm light makes night reading comfortable.', daysAgo: 50, verifiedPurchase: true },
  { product: 'Nike Air Max 270', author: 'Luis G.', rating: 4, title: 'Comfortable', comment: 'Very comfortable for walking, runs half a size small.', daysAgo: 22, verifiedPurchase: true },
  { product: 'Nike Air Max 270', author: 'Grace P.', rating: 2, title: 'Not for running', comment: 'Looks great but my feet hurt after a 5k run.', daysAgo: 15, verifiedPurchase: true },
  { product: 'Adidas Ultraboost 22', author: 'Sam O.', rating: 5, title: 'Best running shoe', comment: 'Responsive and light, I use them for long runs.', daysAgo: 28, verifiedPurchase: true },
  { product: 'Adidas Ultraboost 22', author: 'Ivy M.', rating: 5, title: 'So comfortable', comment: 'Feels like running on clouds. True to size.', daysAgo: 7, verifiedPurchase: false },
  { product: "Levi's 501 Jeans", author: 'Daniel F.', rating: 4, title: 'Classic fit', comment: 'Same great fit as always, slightly stiff at first.', daysAgo: 35, verifiedPurchase: true },
  { product: 'Patagonia Better Sweater Jacket', author: 'Olivia B.', rating: 5, title: 'Warm and soft', comment: 'Perfect for autumn mornings, washes well.', daysAgo: 20, verifiedPurchase: true },
  { product: 'Uniqlo Supima Cotton T-Shirt', author: 'Ravi N.', rating: 3, title: 'Shrinks a bit', comment: 'Nice fabric, but it shrank after the first wash.', daysAgo: 11, verifiedPurchase: true },
  { product: 'The Great Gatsby', author: 'Hannah C.', rating: 5, title: 'Timeless', comment: 'Beautiful prose. This edition has a good introduction.', daysAgo: 60, verifiedPurchase: true },
  { product: 'Atomic Habits', author: 'Kevin T.', rating: 5, title: 'Practical and clear', comment: 'Every chapter has something I could apply the same day.', daysAgo: 45, verifiedPurchase: true },
  { product: 'Atomic Habits', author: 'Mia J.', rating: 4, title: 'Good read', comment: 'A little repetitive towards the end, but very useful.', daysAgo: 14, verifiedPurchase: true },
  { product: 'Atomic Habits', author: 'Zoe A.', rating: 5, title: 'Changed my routine', comment: 'The habit stacking idea alone was worth the price.', daysAgo: 5, verifiedPurchase: false },
  { product: 'The Pragmatic Programmer', author: 'Victor E.', rating: 5, title: 'Must read for developers', comment: 'Still relevant decades later. Read it twice.', daysAgo: 33, verifiedPurchase: true },
  { product: 'Instant Pot Duo 7-in-1', author: 'Laura K.', rating: 4, title: 'Weeknight saver', comment: 'Makes rice and stews quickly. The manual could be clearer.', daysAgo: 27, verifiedPurchase: true },
  { product: 'Dyson V11 Cordless Vacuum', author: 'Peter Q.', rating: 2, title: 'Battery disappoints', comment: 'Strong suction but the battery drains fast on max power.', daysAgo: 19, verifiedPurchase: true },
  { product: 'Premium Yoga Mat 6mm', author: 'Sofia V.', rating: 5, title: 'Great grip', comment: 'Does not slip even in hot yoga classes.', daysAgo: 8, verifiedPurchase: true },
  { product: 'Hydro Flask 32 oz Water Bottle', author: 'Jack U.', rating: 4, title: 'Keeps water cold', comment: 'Ice lasts a full day, the lid is a bit hard to clean.', daysAgo: 16, verifiedPurchase: true },
];

export interface SeedAddress {
  email: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const SEED_ADDRESSES: SeedAddress[] = [
  { email: 'john@example.com', label: 'Home', fullName: 'John Doe', phone: '+1 415 555 0134',
    street: '742 Evergreen Terrace', city: 'San Francisco', state: 'CA', zipCode: '94110', country: 'United States' },
];

export interface SeedOrder {
  email: string;
  orderNumber: string;
  daysAgo: number;
  items: { product: string; quantity: number }[];
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  history: OrderStatus[];
}

export const SEED_ORDERS: SeedOrder[] = [
  { email: 'john@example.com', orderNumber: 'ORD-1001', daysAgo: 21, shippingMethod: 'standard', paymentMethod: 'card',
    items: [{ product: 'Atomic Habits', quantity: 1 }, { product: 'Premium Yoga Mat 6mm', quantity: 2 }],
    history: ['pending', 'processing', 'shipped', 'delivered'] },
  { email: 'john@example.com', orderNumber: 'ORD-1002', daysAgo: 4, shippingMethod: 'express', paymentMethod: 'paypal',
    items: [{ product: 'Logitech MX Master 3S Mouse', quantity: 1 }],
    history: ['pending', 'processing', 'shipped'] },
  { email: 'john@example.com', orderNumber: 'ORD-1003', daysAgo: 1, shippingMethod: 'standard', paymentMethod: 'card',
    items: [{ product: 'Converse Chuck Taylor All Star', quantity: 1 }],
    history: ['pending'] },
  { email: 'jane@example.com', orderNumber: 'ORD-1004', daysAgo: 2, shippingMethod: 'overnight', paymentMethod: 'card',
    items: [{ product: 'Instant Pot Duo 7-in-1', quantity: 1 }],
    history: ['pending', 'processing'] },
];

export const SEED_WISHLIST: { email: string; product: string }[] = [
  { email: 'john@example.com', product: 'Dyson V11 Cordless Vacuum' },
  { email: 'john@example.com', product: 'Kindle Paperwhite' },
];

export const SEED_REFERENCE_DATE = new Date('2026-10-01T10:00:00.000Z');

export const daysBefore = (days: number) => new Date(SEED_REFERENCE_DATE.getTime() - days * 24 * 60 * 60 * 1000);
