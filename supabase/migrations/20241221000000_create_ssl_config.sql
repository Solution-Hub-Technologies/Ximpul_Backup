-- Create SSL configuration table
CREATE TABLE IF NOT EXISTS ssl_config (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR(255) NOT NULL,
    store_password VARCHAR(255) NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SSL configuration
INSERT INTO ssl_config (store_id, store_password, is_live) VALUES 
('sohubshop0live', '65FAB9002A98896874', true);

-- Enable RLS
ALTER TABLE ssl_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin access only" ON ssl_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );