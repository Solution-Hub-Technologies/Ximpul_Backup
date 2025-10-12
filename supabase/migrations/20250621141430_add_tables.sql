
-- Update product prices
UPDATE public.products 
SET price = 1190 
WHERE edition = 'base';

UPDATE public.products 
SET price = 1650 
WHERE edition = 'lifestyle';

-- Update accessory prices
UPDATE public.accessories 
SET price = 90 
WHERE name = 'Cleaning Brush';

UPDATE public.accessories 
SET price = 50 
WHERE name = 'Straw Cleaning Brush';

UPDATE public.accessories 
SET price = 90 
WHERE name = 'Aluminium Hook';

UPDATE public.accessories 
SET price = 350 
WHERE name = 'Straw Cap';

-- Add email column to orders table (optional field)
ALTER TABLE public.orders 
ADD COLUMN customer_email TEXT;
