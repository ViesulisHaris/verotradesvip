-- Simple Strategy Schema Fix for Supabase SQL Editor
-- Purpose: Clear cached references to deleted compliance tables

-- Step 1: Clear query plan cache
DISCARD PLANS;

-- Step 2: Analyze key tables to refresh statistics
ANALYZE strategies;
ANALYZE trades;
ANALYZE strategy_rules;

-- Step 3: Test basic strategies query
DO $$
DECLARE
    strategy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO strategy_count FROM strategies WHERE is_active = true;
    RAISE NOTICE '✅ Strategies query test passed: % active strategies found', strategy_count;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Strategies query failed: %', SQLERRM;
END $$;

-- Step 4: Test strategy_rules query
DO $$
DECLARE
    rules_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rules_count FROM strategy_rules;
    RAISE NOTICE '✅ Strategy rules query test passed: % rules found', rules_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Strategy rules query failed (table may not exist): %', SQLERRM;
END $$;

-- Step 5: Verify deleted tables do not exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance')
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✅ Confirmed: Deleted tables do not exist';
    ELSE
        RAISE EXCEPTION '❌ Deleted tables still exist';
    END IF;
END $$;

-- Step 6: Check for any remaining references
DO $$
DECLARE
    remaining_count INTEGER := 0;
BEGIN
    -- Check pg_tables for any references
    SELECT COUNT(*) INTO remaining_count
    FROM pg_tables
    WHERE tablename LIKE '%strategy_rule_compliance%'
    OR tablename LIKE '%compliance_table%'
    OR tablename LIKE '%rule_compliance%';
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ No deleted table references found in pg_tables';
    ELSE
        RAISE WARNING '⚠️ Found % deleted table references in pg_tables', remaining_count;
    END IF;
    
    -- Check information_schema for any references
    SELECT COUNT(*) INTO remaining_count
    FROM information_schema.tables
    WHERE table_name LIKE '%strategy_rule_compliance%'
    OR table_name LIKE '%compliance_table%'
    OR table_name LIKE '%rule_compliance%';
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ No deleted table references found in information_schema';
    ELSE
        RAISE WARNING '⚠️ Found % deleted table references in information_schema', remaining_count;
    END IF;
END $$;

-- Final message
RAISE NOTICE '';
RAISE NOTICE '=========================================';
RAISE NOTICE 'SIMPLE STRATEGY SCHEMA FIX COMPLETE';
RAISE NOTICE '=========================================';
RAISE NOTICE '';
RAISE NOTICE 'If all tests passed above, the strategy_rule_compliance';
RAISE NOTICE 'error should now be resolved.';
RAISE NOTICE '';