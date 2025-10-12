-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to read all users
CREATE POLICY admin_users_select_policy ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow admins to insert new users
CREATE POLICY admin_users_insert_policy ON admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow admins to update users
CREATE POLICY admin_users_update_policy ON admin_users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default admin user if not exists
INSERT INTO admin_users (name, email, role, is_active)
SELECT 'Admin User', 'admin@ximpul.com', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@ximpul.com');

-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (name, description, permissions)
VALUES 
  ('admin', 'Full access to all features', '{"all": true}'::jsonb),
  ('editor', 'Can edit products and manage orders', '{"orders": true, "products": true, "customers": {"read": true}}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on admin_users
CREATE TRIGGER update_admin_users_timestamp
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();