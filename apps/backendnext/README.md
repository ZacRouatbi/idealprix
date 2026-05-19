# Ideal Prix Admin Dashboard

A production-ready Next.js administrative dashboard for the Ideal Prix e-commerce ecosystem.

## Architecture

### Core Modules

1. **Client Management Engine** (`src/services/client-service.ts`)
   - Full CRUD operations for customer management
   - Role-Based Access Control (RBAC) with roles: admin, manager, staff, customer
   - Order history tracking

2. **Order Management System (OMS)** (`src/services/order-service.ts`)
   - Real-time lifecycle tracking: pending → processing → shipped → delivered → cancelled
   - Automated invoicing workflows
   - Refund processing

3. **Inventory & Warehouse Intelligence** (`src/services/inventory-service.ts`)
   - SKU management with variants
   - Real-time stock level monitoring
   - Low-stock threshold alerts
   - Inventory adjustment logs

4. **Product Information Management (PIM)** (`src/services/product-service.ts`)
   - Multi-variant product support
   - Dynamic pricing
   - Media asset management
   - SEO metadata optimization

5. **Hierarchical Taxonomy System** (`src/services/taxonomy-service.ts`)
   - Nested category/sub-category management
   - Drag-and-drop reorganization

### Technical Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Ideal Prix theme
- **State Management**: TanStack Query (React Query)
- **UI Components**: Custom components built with Radix UI primitives
- **Charts**: Recharts for analytics visualization

### Key Features

- Server-side filtering and pagination
- Responsive sidebar navigation
- Real-time analytics dashboard
- Type-safe API service layer
- Clean architecture separation (services, components, types)

### Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run ESLint
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```