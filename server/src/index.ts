import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
// CLIENT_URL accepts a comma-separated list so deployed frontends can be
// added through env config without a code change
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5005',
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
];

// Matches only this app's Render frontend and its PR preview URLs. Scoped to
// the known service name rather than all of *.onrender.com, since credentials
// are enabled and anyone can host on that shared domain.
const RENDER_ORIGIN = /^https:\/\/sample-ecom-client(-pr-\d+)?\.onrender\.com$/;

const isAllowedOrigin = (origin: string | undefined): boolean => {
  // No Origin header means a non-browser caller (curl, Selenium API specs)
  if (!origin) return true;
  return allowedOrigins.includes(origin) || RENDER_ORIGIN.test(origin);
};

app.use(helmet());
app.use(cors({
  // Omit the header for disallowed origins rather than throwing, so a blocked
  // request fails in the browser instead of surfacing as a 500
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API docs available at http://localhost:${PORT}/health`);
  });
}

export default app;