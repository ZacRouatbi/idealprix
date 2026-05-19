-- Smart Pagination Optimization Migration
-- Run this to create indexes that improve pagination query performance

-- Index for products pagination (primary sorting by id for cursor-based pagination)
CREATE INDEX IF NOT EXISTS idx_products_id_desc ON products (id DESC);

-- Index for products filtering by active status
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products (is_active, created_at DESC);

-- Index for products filtering by category
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

-- Index for products full-text search
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index for products price range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);

-- Index for categories hierarchy
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order);

-- Index for orders pagination
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);

-- Index for audit logs pagination
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- Index for users/clients
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory (product_id);

-- Composite index for product list with category join (covers common query pattern)
CREATE INDEX IF NOT EXISTS idx_products_list_cover ON products (is_active, created_at DESC, id DESC) INCLUDE (name, slug, price, image_url, stock_quantity, category_id);

-- Analyze tables to update statistics after creating indexes
ANALYZE products;
ANALYZE categories;
ANALYZE orders;
ANALYZE audit_logs;
ANALYZE users;
ANALYZE inventory;