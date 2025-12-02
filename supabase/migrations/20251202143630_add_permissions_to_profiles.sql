-- Add permissions column to profiles table
-- This column will store an array of page permissions for each user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN profiles.permissions IS 'Array of page view permissions for the user. Example: ["Dashboard", "Clients", "Policies"]';
