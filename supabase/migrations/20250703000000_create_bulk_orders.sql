-- Create bulk_orders table
CREATE TABLE public.bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_location TEXT NOT NULL,
  products JSONB NOT NULL,
  timeline DATE,
  engraving TEXT,
  additional_message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert bulk orders
CREATE POLICY "Anyone can create bulk orders" ON public.bulk_orders FOR INSERT WITH CHECK (true);

-- Create policy to allow viewing bulk orders (for admin)
CREATE POLICY "Anyone can view bulk orders" ON public.bulk_orders FOR SELECT USING (true);
