-- Add password_hash column to admin_users table if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update existing admin users with hashed passwords
-- SECURITY WARNING: Replace <bcrypt_hash> with actual secure password hashes
-- Generate hashes using: bcrypt.hash(password, 12)

-- Example: UPDATE admin_users SET password_hash = '<secure_bcrypt_hash>' WHERE role = 'admin';
-- TODO: Set secure password hashes for each role before deploying to production

-- Uncomment and update with secure hashes:
-- UPDATE admin_users SET password_hash = '<admin_bcrypt_hash>' WHERE role = 'admin' AND password_hash IS NULL;
-- UPDATE admin_users SET password_hash = '<manager_bcrypt_hash>' WHERE role = 'manager' AND password_hash IS NULL;
-- UPDATE admin_users SET password_hash = '<supervisor_bcrypt_hash>' WHERE role = 'supervisor' AND password_hash IS NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Add login attempt tracking table
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Create index for login attempts
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_time 
ON admin_login_attempts(email, attempted_at DESC);

-- Add session tracking table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index for sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to track login attempts
CREATE OR REPLACE FUNCTION track_login_attempt(
    p_email TEXT,
    p_ip_address INET,
    p_success BOOLEAN,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO admin_login_attempts (email, ip_address, success, user_agent)
    VALUES (p_email, p_ip_address, p_success, p_user_agent);
    
    -- Clean up old attempts (keep only last 100 per email)
    DELETE FROM admin_login_attempts 
    WHERE id NOT IN (
        SELECT id FROM admin_login_attempts 
        WHERE email = p_email 
        ORDER BY attempted_at DESC 
        LIMIT 100
    ) AND email = p_email;
END;
$$ LANGUAGE plpgsql;