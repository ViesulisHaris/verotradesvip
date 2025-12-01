-- CRITICAL FIX: Clean up trades with multiple markets and enforce single market selection
-- This script addresses the critical glitch where users can select multiple markets

-- Step 1: Identify all trades with multiple markets (containing commas)
-- This will show us the corrupted data that needs to be cleaned up

SELECT 
    id,
    user_id,
    market,
    symbol,
    trade_date,
    side,
    created_at
FROM trades 
WHERE market LIKE '%,%' 
ORDER BY created_at DESC;

-- Step 2: Count how many trades are affected
SELECT 
    COUNT(*) as corrupted_trades_count,
    COUNT(DISTINCT user_id) as affected_users
FROM trades 
WHERE market LIKE '%,%';

-- Step 3: Show the different combinations of markets that were selected
SELECT 
    market,
    COUNT(*) as count
FROM trades 
WHERE market LIKE '%,%'
GROUP BY market
ORDER BY count DESC;

-- Step 4: Delete all trades with multiple markets to fix statistics corruption
-- WARNING: This will permanently delete corrupted trades!

DELETE FROM trades 
WHERE market LIKE '%,%';

-- Step 5: Verify the cleanup was successful
SELECT 
    COUNT(*) as remaining_trades,
    COUNT(CASE WHEN market LIKE '%,%' THEN 1 END) as corrupted_trades_remaining
FROM trades;

-- Step 6: Add a constraint to prevent future multiple market selections
-- This ensures the issue cannot happen again at the database level

-- First, let's check if the market column has a check constraint already
SELECT 
    conname,
    consrc
FROM pg_constraint 
WHERE conrelid = 'trades'::regclass 
AND contype = 'c';

-- Add a check constraint to ensure market is one of the valid single values
ALTER TABLE trades 
ADD CONSTRAINT check_single_market 
CHECK (market IN ('stock', 'crypto', 'forex', 'futures'));

-- Step 7: Create an index on market for better performance
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market);

-- Step 8: Update the market column to be NOT NULL if it isn't already
ALTER TABLE trades 
ALTER COLUMN market SET NOT NULL;

-- Final verification: Show the clean state of the trades table
SELECT 
    COUNT(*) as total_trades,
    COUNT(DISTINCT market) as unique_markets,
    ARRAY_AGG(DISTINCT market) as available_markets
FROM trades;

-- Show sample of clean trades
SELECT 
    id,
    user_id,
    market,
    symbol,
    trade_date,
    side
FROM trades 
ORDER BY created_at DESC
LIMIT 10;