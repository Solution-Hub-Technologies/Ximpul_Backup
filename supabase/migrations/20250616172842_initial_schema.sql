
-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  edition TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create accessories table
CREATE TABLE public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  selected_edition TEXT NOT NULL,
  selected_color TEXT NOT NULL,
  selected_accessories JSONB DEFAULT '[]',
  engraving_text TEXT,
  payment_method TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial product data
INSERT INTO public.products (name, edition, price, description) VALUES
  ('Ximpul Flow', 'base', 1090, 'Essential hydration solution'),
  ('Ximpul Flow', 'lifestyle', 1590, 'Complete lifestyle package');

-- Insert initial accessories data
INSERT INTO public.accessories (name, price, note) VALUES
  ('Silicone Sleeve', 300, 'Soft grip and extra protection'),
  ('Straw Cap', 250, 'Flexibility for active use'),
  ('Standard Cap', 200, 'Replace or upgrade'),
  ('Straw Cleaning Brush', 150, 'Maintain hygiene easily'),
  ('Cleaning Brush', 150, 'Maintain hygiene easily'),
  ('Aluminium Hook', 200, 'Strong, metallic hook for bag mounting');

-- Enable Row Level Security (we'll make these public for now since no auth is implemented)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access for products and accessories
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can view accessories" ON public.accessories FOR SELECT USING (true);

-- Create policy to allow anyone to insert orders (for checkout)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);
