-- Fix orders status check constraint to include 'paid'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'));