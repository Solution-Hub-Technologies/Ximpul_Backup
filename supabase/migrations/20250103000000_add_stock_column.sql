-- Add stock column to products table
ALTER TABLE public.products 
ADD COLUMN stock INTEGER DEFAULT 0;

-- Set initial stock values for existing products
UPDATE public.products 
SET stock = 50 
WHERE edition = 'base';

UPDATE public.products 
SET stock = 30 
WHERE edition = 'lifestyle';