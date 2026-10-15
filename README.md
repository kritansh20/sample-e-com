# Sample E-Commerce Application

A full-stack e-commerce application built with Node.js, Express, TypeScript (backend) and React, TypeScript (frontend).

## Features

An in-memory store with realistic flows, validation and edge states. Every interactive element has a `data-testid`.

| Area | What it does |
|---|---|
| Accounts | Sign up (name, email and password rules, confirm password, terms), log in and out, redirect back to the page you came from, admin role |
| Catalog | 24 products in 6 categories; search (name, brand, description); category, price range, minimum rating, in-stock and on-sale filters; 6 sort orders; 12 per page; filters kept in the URL |
| Product page | Breadcrumb, sale price and savings, low-stock and out-of-stock states, quantity limits, add to cart, wishlist, compare |
| Reviews | Rating summary and distribution, sort, write a review (1-5 stars, title, text) with validation, one review per customer, "Verified purchase" for delivered orders, delete your own review |
| Wishlist | Saved per account; add or remove from cards and product pages, move to cart, header count |
| Compare | Up to 3 products side by side, lowest price and top rated highlighted, kept across page loads |
| Cart | Quantity limits (stock and 10 per item), save for later, remove, clear with confirmation, coupons, free-shipping progress |
| Checkout | Saved address or new address with per-country postal codes, save the address, 3 shipping methods, card / PayPal / cash on delivery with card validation, totals calculated by the server |
| Orders | Filter by status, order page with status timeline, estimated delivery, cancel with a reason (pending or processing only), buy again |
| My Account | Edit name, change password, address book (up to 5, one default) |
| Admin | Dashboard stats, add / edit / delete products with validation, move orders through allowed status changes |
| Extras | Currency converter page |

## Project Structure

```
sample-e-com/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── data/           # Seed data (products, reviews, orders, addresses)
│   │   ├── services/       # Pricing, cart totals, coupons
│   │   ├── utils/          # Validation helpers
│   │   ├── repositories/   # Data access layer
│   │   ├── models/         # Data models and types
│   │   ├── middleware/     # Auth and other middleware
│   │   └── routes/         # API route definitions
│   ├── jest.config.js      # Jest + ts-jest (tests go in src/**/*.test.ts)
│   ├── jest.setup.js       # Sets NODE_ENV=test and JWT_SECRET for tests
│   └── package.json
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript type definitions
│   │   ├── styles/         # Global styles
│   │   └── utils/          # test-utils.tsx: render with providers + mock data
│   ├── cypress/            # Cypress config support, commands, fixtures (specs go in cypress/e2e)
│   ├── selenium/           # Selenium + Mocha config, support, fixtures (specs go in selenium/e2e)
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sample-e-com
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

3. **Set up environment variables**

Create a `.env` file in the `server` directory:
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Create a `.env` file in the `client` directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

#### Development Mode (Both Server and Client)
```bash
npm run dev
```

#### Server Only
```bash
npm run server
```

#### Client Only
```bash
npm run client
```

#### Production Build
```bash
npm run build
npm start
```

### Testing

This repository ships the test tooling but **no tests**. Add tests here:

| Layer | Framework | Put tests in | Run |
|---|---|---|---|
| Server unit and API | Jest + ts-jest, Supertest | `server/src/**/*.test.ts` | `cd server && npm test` (coverage: `npm run test:coverage`) |
| Client components and pages | Jest + React Testing Library (react-scripts) | `client/src/**/*.test.tsx` or `client/src/**/__tests__/` | `cd client && npm test -- --watchAll=false` |
| E2E with Cypress | Cypress | `client/cypress/e2e/**/*.cy.{js,ts}` | `cd client && npm run cypress:run` |
| E2E with Selenium | selenium-webdriver + Mocha | `client/selenium/e2e/**/*.js` | `cd client && npm run selenium:run` |
| E2E on BrowserStack | browserstack-cypress-cli, browserstack-node-sdk | as above | `cd client && npm run browserstack:run` or `npm run selenium:browserstack` (see `client/BROWSERSTACK_SETUP.md`) |

`npm test` at the root runs the server and client Jest suites.

Helpers:
- Server: `server/jest.setup.js` sets `NODE_ENV=test` and `JWT_SECRET`. Import the Express app from `server/src/index.ts` for Supertest; it does not start listening when `NODE_ENV=test`.
- Client: `client/src/utils/test-utils.tsx` renders with the Router, Auth and Cart providers and exports mock data. `client/src/setupTests.js` loads jest-dom.
- Cypress: `client/cypress/support/commands.js` (`cy.loginAsTestUser`, `cy.registerNewUser`, ...) and fixtures in `client/cypress/fixtures/`.
- Selenium: `client/selenium/config/`, `client/selenium/support/`, `client/selenium/fixtures/`.

E2E tests need the app running: `npm run dev` from the repo root starts the API on http://localhost:5010 and the client on http://localhost:5005 (the Cypress `baseUrl`).

Seeded users (in memory, reset when the server restarts): `john@example.com` / `Ecomm@123` and `jane@example.com` / `Ecomm@123`.

## API Endpoints

All responses are `{ success, data }` or `{ success: false, error, fields? }`; `fields` maps form fields to messages on 400 validation errors.

### Auth
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/profile`, `PUT /api/auth/profile` (first and last name), `PUT /api/auth/password` (current and new password)

### Products and reviews
- `GET /api/products` with `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `inStock=true`, `onSale=true`, `featured=true`, `sort` (`relevance`, `price_asc`, `price_desc`, `rating`, `newest`, `name`), `page`, `limit` (1-50)
- `GET /api/products/featured`, `GET /api/products/categories`, `GET /api/products/:id`
- `GET /api/products/:id/reviews?sort=newest|highest|lowest`, `POST /api/products/:id/reviews`, `DELETE /api/products/:id/reviews/:reviewId`

### Cart, coupons and wishlist (logged in)
- `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:itemId`, `DELETE /api/cart/:itemId`, `DELETE /api/cart`
- `POST /api/cart/:itemId/move-to-wishlist`, `POST /api/cart/coupon` (`{ code }`), `DELETE /api/cart/coupon`
- `GET /api/wishlist`, `POST /api/wishlist` (`{ productId }`), `DELETE /api/wishlist/:productId`, `POST /api/wishlist/:productId/move-to-cart`

### Checkout and orders (logged in)
- `GET /api/orders/shipping-options`, `POST /api/orders/quote` (`{ shippingMethod }`)
- `POST /api/orders` (`addressId` or `shippingAddress` + `saveAddress`, `shippingMethod`, `paymentMethod` `card|paypal|cod`, `cardLast4` for card)
- `GET /api/orders?status=`, `GET /api/orders/:id`, `PUT /api/orders/:id/cancel` (`{ reason }`), `POST /api/orders/:id/reorder`

### Addresses (logged in)
- `GET /api/addresses`, `POST /api/addresses`, `PUT /api/addresses/:id`, `PUT /api/addresses/:id/default`, `DELETE /api/addresses/:id`

### Admin (admin role)
- `GET /api/admin/stats`
- `GET /api/admin/products?search=`, `POST /api/admin/products`, `PUT /api/admin/products/:id`, `DELETE /api/admin/products/:id`
- `GET /api/admin/orders?status=`, `PUT /api/admin/orders/:id/status` (`{ status }`)

## Business Rules

| Rule | Value |
|---|---|
| Quantity per cart line | Whole number, at most the stock and at most 10 |
| Tax | 8% of the order after discount |
| Shipping | Standard $5.99 (free from $100 after discount, or with `FREESHIP`), Express $14.99, Overnight $29.99 |
| Estimated delivery | Standard 7 days, Express 3 days, Overnight 1 day |
| Cash on delivery | Orders up to $500 |
| Order cancel | Customer: pending or processing. Admin: pending → processing or cancelled, processing → shipped or cancelled, shipped → delivered. Cancelling returns stock |
| Passwords | At least 8 characters with a letter and a number |
| Postal codes | US `94110` or `94110-1234`, Canada `K1A 0B1`, UK `SW1A 1AA`, India `560001`; state or province required except in the UK |
| Address book | Up to 5 addresses; the first one is the default |
| Reviews | Rating 1-5, title 3-80 characters, text 10-1000 characters, one per customer per product |

## Seeded Test Data

All data lives in memory and resets when the server restarts.

| Users | Password | Notes |
|---|---|---|
| `john@example.com` | `Ecomm@123` | Customer. 1 saved address, 2 wishlist items, orders ORD-1001 (delivered), ORD-1002 (shipped), ORD-1003 (pending) |
| `jane@example.com` | `Ecomm@123` | Customer. Order ORD-1004 (processing), no saved address |
| `admin@example.com` | `Admin@123` | Admin |

| Coupon | Effect |
|---|---|
| `WELCOME10` | 10% off |
| `SAVE20` | $20 off orders of $150 or more (removed automatically if the cart drops below $150) |
| `FREESHIP` | Free standard shipping |
| `BOOKS15` | 15% off Books items only |
| `SUMMER25` | Expired |

Products: 24 across Books, Clothing, Electronics, Footwear, Home & Kitchen and Sports. 6 are on sale, 2 are out of stock (Kindle Paperwhite, Nespresso Vertuo Coffee Maker), 3 are low stock (Sony WH-1000XM5 Headphones: 3, Timberland boot: 2, Adjustable Dumbbells: 5), and 8 have no reviews yet.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Testing**: Jest, Supertest
- **Validation**: Manual validation (easily extensible to libraries like Joi)
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Library**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Styled Components
- **HTTP Client**: Axios
- **Testing**: React Testing Library, Jest
- **Build Tool**: Create React App

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for both server and client
- **Prettier**: Code formatting (can be added)
- **Naming**: Consistent camelCase for variables, PascalCase for components

### Deployment Considerations
- **Environment Variables**: Separate configs for dev/prod
- **Build Process**: Optimized production builds
- **CORS**: Configured for production domains
- **Error Handling**: Production-safe error messages
- **Logging**: Console logging (extensible to proper logging services)

## Deployment

The app is deployed as two independent services:

| Service            | Platform | Live URL                                        |
| ------------------ | -------- | ----------------------------------------------- |
| Backend (Express)  | Vercel   | `https://server-puce-gamma-22.vercel.app`       |
| Frontend (React)   | Render   | `https://sample-ecom-client.onrender.com`       |

Deploy the **backend first** — the frontend bakes the backend URL into its
bundle at build time, so the backend must exist before the frontend builds.

### Backend → Vercel

The backend is linked to a Vercel project (`server/.vercel/`). From the
`server/` directory:

```bash
cd server
npx vercel          # deploy a preview build
npx vercel --prod   # promote to production
```

- **Framework preset**: Express (root directory = `server/`).
- **Env vars** (set in the Vercel project settings):
  - `CLIENT_URL` — comma-separated list of extra allowed CORS origins.
    The deployed Render frontend and its PR previews
    (`sample-ecom-client(-pr-<n>).onrender.com`) are already allowed in code,
    so this is only needed for additional origins.
- **Verify** the production alias after deploying:
  ```bash
  curl https://server-puce-gamma-22.vercel.app/health
  # -> {"status":"OK",...}
  ```
  > Note: the per-deployment `*.vercel.app` URL is guarded by Vercel Deployment
  > Protection and returns a 302. Use the stable **production alias** above (and
  > for the frontend's `REACT_APP_API_URL`).

### Frontend → Render

The frontend is deployed as a Render **Static Site** described by
[`render.yaml`](render.yaml) at the repo root (root directory = `client/`).

- **Build command**: `npm ci && npm run build`
- **Publish path**: `client/build`
- **SPA routing**: a rewrite of `/*` → `/index.html` so client-side routes
  survive a refresh/direct hit.
- **Env vars** (set in Render, baked in at build time — changing them requires a
  redeploy):
  - `REACT_APP_API_URL` — deployed backend URL **including the `/api` suffix**,
    e.g. `https://server-puce-gamma-22.vercel.app/api`.
  - `CI=false` — optional; the build has no lint warnings, so `CI=true` also works.
  - `NODE_VERSION=20`.

Render auto-deploys on pushes to `main`. To trigger manually, use
**Manual Deploy** in the Render dashboard.

### Deployed Endpoints

`https://sample-ecom-client.onrender.com` and `https://server-puce-gamma-22.vercel.app` are the upstream deployment of `Aryan-Stack012/sample-e-com`. That build still has the random delays, partial responses and bugs that this repository removes, so deploy this repository with `render.yaml` before using a deployed URL as a test target.

## Extending the Application

### Adding a Real Database
1. Install database driver (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Update repository classes to use database queries instead of in-memory storage
3. Add database connection configuration
4. Implement migrations for schema management

### Adding More Features
- **Payment Integration**: Stripe, PayPal, etc.
- **Email Notifications**: Order confirmations, shipping updates
- **Admin Panel**: Product management, order management
- **Reviews & Ratings**: Product reviews and ratings
- **Inventory Management**: Stock tracking, low stock alerts
- **Wishlist**: Save products for later
- **Discounts & Coupons**: Promotional codes and discounts

### Performance Optimizations
- **Caching**: Redis for session and data caching
- **CDN**: For static assets and images
- **Database Indexing**: Optimize query performance
- **Code Splitting**: Lazy load React components
- **Image Optimization**: Compress and resize product images

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on the GitHub repository.