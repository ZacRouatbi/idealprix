-- Migration: Add shipping_provider_id to orders table
-- Run this to store which shipping provider was used for each order

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider_id UUID REFERENCES shipping_providers(id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_shipping_provider_id ON orders (shipping_provider_id);