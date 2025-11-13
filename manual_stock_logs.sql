-- Create manual_stock_logs table for admin-made stock changes
CREATE TABLE IF NOT EXISTS manual_stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'accessory')),
  item_name TEXT NOT NULL,
  item_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL,
  changed_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_manual_stock_logs_created_at ON manual_stock_logs(created_at DESC);
CREATE INDEX idx_manual_stock_logs_item_id ON manual_stock_logs(item_id);
CREATE INDEX idx_manual_stock_logs_changed_by ON manual_stock_logs(changed_by);

-- Enable Row Level Security
ALTER TABLE manual_stock_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to read all logs
CREATE POLICY "Admin users can view manual stock logs" ON manual_stock_logs
  FOR SELECT
  USING (true);

-- Create policy to allow admin users to insert logs
CREATE POLICY "Admin users can insert manual stock logs" ON manual_stock_logs
  FOR INSERT
  WITH CHECK (true);
