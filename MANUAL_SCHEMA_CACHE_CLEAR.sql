-- Manual Schema Cache Clear for Supabase
-- Execute this in your Supabase SQL Editor: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql

-- Step 1: Clear all caches
DISCARD PLANS;
DISCARD SEQUENCES;
DISCARD TEMP;
RESET ALL;

-- Step 2: Force statistics rebuild
ANALYZE;

-- Step 3: Create and drop temp table to force cache refresh
CREATE TEMP TABLE cache_refresh_trigger (id INTEGER);
DROP TABLE cache_refresh_trigger;

-- Step 4: Final cache clear
DISCARD ALL;

-- Step 5: The most important command - reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'Schema cache clear completed at ' || NOW() as status;