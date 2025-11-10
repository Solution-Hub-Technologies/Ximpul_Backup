
-- Make customer_email column nullable to allow orders without email
ALTER TABLE public.orders 
ALTER COLUMN customer_email DROP NOT NULL;
