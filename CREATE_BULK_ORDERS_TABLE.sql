-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.bulk_orders (
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
  pricing_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bulk orders" ON public.bulk_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view bulk orders" ON public.bulk_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update bulk orders" ON public.bulk_orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete bulk orders" ON public.bulk_orders FOR DELETE USING (true);
