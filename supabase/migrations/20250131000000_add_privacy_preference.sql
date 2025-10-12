-- Add privacy preference column to orders table
ALTER TABLE public.orders 
ADD COLUMN privacy_preference BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.orders.privacy_preference IS 'If true, this order should not be used for marketing or social media purposes';