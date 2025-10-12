-- Create SMTP configuration table
CREATE TABLE IF NOT EXISTS smtp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    port INTEGER NOT NULL DEFAULT 587,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL DEFAULT 'Ximpul Shop',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No default SMTP configuration inserted for security
-- Admin must configure SMTP settings through the admin panel

-- Enable RLS
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage SMTP config" ON smtp_config
    FOR ALL USING (auth.role() = 'authenticated');