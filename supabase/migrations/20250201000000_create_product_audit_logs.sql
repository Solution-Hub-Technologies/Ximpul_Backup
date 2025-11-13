-- Create product audit logs table
CREATE TABLE IF NOT EXISTS product_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item Information
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'accessory')),
  item_name TEXT NOT NULL,
  
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'stock_add', 'stock_remove', 'price_change')),
  
  -- Change Details
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  
  -- Stock specific fields
  color TEXT CHECK (color IN ('black', 'grey', 'default', NULL)),
  stock_change INTEGER,
  previous_stock INTEGER,
  new_stock INTEGER,
  
  -- Price specific fields
  previous_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  
  -- Admin Information
  admin_id UUID NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT,
  admin_role TEXT,
  
  -- Additional Context
  reason TEXT,
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to admin_users
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_product_audit_logs_item_id ON product_audit_logs(item_id);
CREATE INDEX idx_product_audit_logs_item_type ON product_audit_logs(item_type);
CREATE INDEX idx_product_audit_logs_action_type ON product_audit_logs(action_type);
CREATE INDEX idx_product_audit_logs_admin_id ON product_audit_logs(admin_id);
CREATE INDEX idx_product_audit_logs_created_at ON product_audit_logs(created_at DESC);
CREATE INDEX idx_product_audit_logs_item_name ON product_audit_logs(item_name);

-- Enable Row Level Security
ALTER TABLE product_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read all logs
CREATE POLICY "Admin users can view all audit logs"
  ON product_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create policy for system to insert logs
CREATE POLICY "System can insert audit logs"
  ON product_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE product_audit_logs IS 'Audit trail for all product and accessory changes made by admin users';
COMMENT ON COLUMN product_audit_logs.action_type IS 'Type of action: create, update, delete, stock_add, stock_remove, price_change';
COMMENT ON COLUMN product_audit_logs.item_type IS 'Type of item: product or accessory';
COMMENT ON COLUMN product_audit_logs.field_changed IS 'Name of the field that was changed (for update actions)';
