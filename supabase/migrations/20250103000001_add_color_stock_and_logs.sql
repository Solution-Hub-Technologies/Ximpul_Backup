-- Add order_id column to orders table for human-readable order IDs
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Create a function to generate order IDs
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    new_order_id TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of orders + 1
    SELECT COUNT(*) + 1 INTO counter FROM orders;
    
    -- Generate order ID in format ORD-XXXXX
    new_order_id := 'ORD-' || LPAD(counter::TEXT, 5, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM orders WHERE order_id = new_order_id) LOOP
        counter := counter + 1;
        new_order_id := 'ORD-' || LPAD(counter::TEXT, 5, '0');
    END LOOP;
    
    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate order_id for new orders
CREATE OR REPLACE FUNCTION set_order_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_id IS NULL THEN
        NEW.order_id := generate_order_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_id
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_id();

-- Update existing orders with order_id if they don't have one
UPDATE public.orders 
SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0')
WHERE order_id IS NULL;

-- Add color-specific stock columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_black INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_grey INTEGER DEFAULT 0;

-- Migrate existing stock data to color-specific columns
UPDATE public.products 
SET stock_black = stock, stock_grey = stock 
WHERE stock > 0;

-- Add color-specific stock columns to accessories table
ALTER TABLE public.accessories 
ADD COLUMN IF NOT EXISTS stock_black INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_grey INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_default INTEGER DEFAULT 0;

-- Set initial stock values for accessories
UPDATE public.accessories 
SET stock_default = 50 
WHERE name IN ('Cleaning Brush', 'Straw Cleaning Brush', 'Aluminium Hook');

UPDATE public.accessories 
SET stock_black = 25, stock_grey = 25 
WHERE name = 'Straw Cap';

-- Create stock_logs table for tracking stock changes
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'product' or 'accessory'
  item_name TEXT NOT NULL,
  color TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on stock_logs table
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view and create stock logs
CREATE POLICY "Admin can view stock logs" ON public.stock_logs 
FOR SELECT USING (true);

CREATE POLICY "Admin can create stock logs" ON public.stock_logs 
FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_logs_item_type ON public.stock_logs(item_type);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item_name ON public.stock_logs(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON public.stock_logs(created_at DESC);