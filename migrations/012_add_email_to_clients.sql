-- Add email column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email text;
