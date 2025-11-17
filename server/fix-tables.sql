-- Run these SQL commands directly in PostgreSQL to fix the token columns
-- Connect: psql -U galaxy -d connectiondb

-- Fix user_sessions table
ALTER TABLE user_sessions ALTER COLUMN session_token TYPE TEXT;
ALTER TABLE user_sessions ALTER COLUMN refresh_token TYPE TEXT;

-- Fix password_reset_tokens table
ALTER TABLE password_reset_tokens ALTER COLUMN token TYPE TEXT;

-- Fix email_verification_tokens table
ALTER TABLE email_verification_tokens ALTER COLUMN token TYPE TEXT;

-- Fix project_invitations table
ALTER TABLE project_invitations ALTER COLUMN invitation_token TYPE TEXT;

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('user_sessions', 'password_reset_tokens', 'email_verification_tokens', 'project_invitations')
AND column_name LIKE '%token%'
ORDER BY table_name, column_name;

