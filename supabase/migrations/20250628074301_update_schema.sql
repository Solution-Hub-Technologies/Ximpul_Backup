
-- First, update existing orders with null customer_email to have a placeholder
UPDATE public.orders 
SET customer_email = 'customer@placeholder.com' 
WHERE customer_email IS NULL;

-- Now we can safely make the column NOT NULL
ALTER TABLE public.orders 
ALTER COLUMN customer_email SET NOT NULL;

-- Add the new tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order status history table for tracking changes
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.admin_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin users can manage admin accounts" ON public.admin_users 
FOR ALL USING (true);

CREATE POLICY "Admin users can view order history" ON public.order_status_history 
FOR SELECT USING (true);

CREATE POLICY "Admin users can create order history" ON public.order_status_history 
FOR INSERT WITH CHECK (true);

-- Add foreign key constraint for processed_by after admin_users table is created
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_processed_by 
FOREIGN KEY (processed_by) REFERENCES public.admin_users(id);

-- Create indexes for better order queries
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Insert a default admin user (password: admin123 - should be changed immediately)
INSERT INTO public.admin_users (email, password_hash, name) 
VALUES ('admin@ximpul.com', '$2a$10$rQZ1vfZvHLLtJi5L1uKtMOq8vQ2BhUHq4p8VtBvKzGlCsE0X9Wv3a', 'Admin User');
