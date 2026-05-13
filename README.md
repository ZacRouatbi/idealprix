<p align="center">
  <img src="https://img.shields.io/badge/IdealPrix-E--commerce-blue?style=for-the-badge" alt="IdealPrix" />
  <img src="https://img.shields.io/badge/Monorepo-TurboRepo-orange?style=for-the-badge" alt="TurboRepo" />
</p>

<h1 align="center">IdealPrix</h1>

<p align="center">
  Tunisian e-commerce platform built with Medusa and React
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#project-structure"><strong>Structure</strong></a> ·
  <a href="#api-documentation"><strong>API</strong></a>
</p>

---

## Overview

IdealPrix is a production-ready e-commerce platform designed for the Tunisian market. It provides a complete solution with a headless Medusa backend and a modern React storefront.

## Quick Start

### Prerequisites

- **Node.js** `>= 20`
- **pnpm** (recommended package manager)
- **PostgreSQL** (for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/idealprix-backend.git
cd idealprix-backend

# Install dependencies
pnpm install
```

### Backend Setup

```bash
# Copy environment template
cp apps/backend/.env.template apps/backend/.env

# Configure your DATABASE_URL and other secrets
# Edit apps/backend/.env

# Run migrations and seed data
cd apps/backend
pnpm medusa db:migrate
pnpm medusa seed -- --file migration-scripts/initial-data-seed.ts

# Create admin user
pnpm medusa user -e admin@idealprix.tn -p YourSecurePassword!
```

### Storefront Setup

```bash
# Copy environment template
cp apps/storefront/.env.template apps/storefront/.env.local

# Configure Medusa connection
# Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and NEXT_PUBLIC_MEDUSA_BACKEND_URL
```

### Development

```bash
# Start both backend and storefront
pnpm dev

# Or start individually
pnpm backend:dev   # Backend only
pnpm storefront:dev # Storefront only
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Medusa, Node.js, TypeScript |
| **Frontend** | React 19, Vite, TypeScript |
| **Database** | PostgreSQL |
| **Monorepo** | Turborepo, pnpm |
| **Deployment** | Docker-ready |

## Project Structure

```
idealprix-backend/
├── apps/
│   ├── backend/           # Medusa backend
│   │   ├── src/
│   │   │   ├── api/       # API routes
│   │   │   ├── modules/   # Custom modules
│   │   │   ├── workflows/ # Business workflows
│   │   │   └── subscribers/ # Event subscribers
│   │   └── medusa-config.ts
│   └── storefront/        # React storefront
│       ├── src/
│       │   ├── app/       # Pages and layouts
│       │   ├── lib/       # Data fetching, utils
│       │   └── components/
│       └── vite.config.ts
├── security/              # Security utilities & guidelines
│   ├── zod-schemas.ts     # Input validation
│   ├── headers.ts         # Security headers middleware
│   ├── rate-limit.ts      # Rate limiting
│   └── csrf.md            # CSRF protection guide
└── package.json           # Root monorepo config
```

## Available Scripts

```bash
pnpm dev              # Start all development servers
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Run linting across workspaces

pnpm backend:dev      # Start backend only
pnpm storefront:dev   # Start storefront only
pnpm backend:seed     # Run backend seed script
```

## Security

The `security/` directory contains production-ready security implementations:

- **Input Validation** - Zod schemas with XSS sanitization
- **Security Headers** - Helmet with CSP, HSTS
- **Rate Limiting** - Express middleware for DoS protection
- **CSRF Protection** - Token-based protection guide

Install security dependencies:

```bash
cd apps/backend
npm install helmet express-rate-limit express-slow-down cookie-parser csurf
npm install -D @types/csurf @types/express
```

## API Documentation

### Storefront API Client

Located in `apps/storefront/src/lib/data/`:

```typescript
// Fetch products with category filtering
const products = await fetchProducts({
  category_id: "category-id",
  limit: 20
})

// Fetch categories
const categories = await fetchCategories()

// Fetch regions for checkout
const regions = await fetchRegions()
```

### Backend Endpoints

| Route | Description |
|-------|-------------|
| `/store/products` | List/store products |
| `/store/categories` | Product categories |
| `/store/collections` | Product collections |
| `/store/regions` | Available regions |

## Development

### Environment Variables

**Backend (`apps/backend/.env`):**

```bash
DATABASE_URL=postgres://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
```

**Storefront (`apps/storefront/.env.local`):**

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with%20❤️-Tunisia-red" alt="Made in Tunisia" />
</p>