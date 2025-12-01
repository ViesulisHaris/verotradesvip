-- Schema Cache Corruption Fix for Strategy Loading Error
-- This script clears the Supabase schema cache to resolve the "Could not find the table 'public.strategies' in the schema cache" error

-- Clear query plans and cached execution plans
DISCARD PLANS;

-- Clear temporary tables and other temporary objects
DISCARD TEMP;

-- Clear all cached data including prepared statements, cursors, and temporary tables
DISCARD ALL;

-- Deallocate all prepared statements
DEALLOCATE ALL;

-- Update table statistics for strategies table
ANALYZE strategies;

-- Update table statistics for trades table
ANALYZE trades;

-- Update table statistics for users table
ANALYZE users;

-- Reset connection to default state
RESET CONNECTION;