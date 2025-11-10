-- Add payment_transaction_id column to orders table if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- Add index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_payment_transaction_id ON public.orders(payment_transaction_id);

