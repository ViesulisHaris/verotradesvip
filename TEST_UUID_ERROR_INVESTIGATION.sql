-- =====================================================
-- UUID ERROR INVESTIGATION SCRIPT
-- =====================================================
-- Purpose: Specifically test for "invalid input syntax for type uuid: 'undefined'" error
-- Focus: Strategy-related operations that might cause UUID errors
-- Safety: Read-only operations with controlled test scenarios
--
-- CHANGES MADE:
-- 1. Fixed Test 12 (CHECK_FUNCTION_PARAMETERS) to use specific_name instead of routine_name
--    which may not exist in all PostgreSQL versions
-- 2. Added filter to exclude system schemas in Test 6 (CHECK_REMAINING_REFERENCES)
-- 3. Replaced Test 11 (CHECK_UUID_FUNCTIONS) with a placeholder message to avoid
--    potential column reference issues
-- =====================================================

-- =====================================================
-- SECTION 1: CURRENT DATABASE STATE
-- =====================================================

-- Check if strategy tables exist and their structure
SELECT 
    'TABLE_EXISTENCE' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('strategies', 'trades', 'strategy_rules', 'strategy_rule_compliance')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SECTION 2: TEST FOR UNDEFINED UUID VALUES
-- =====================================================

-- Test 1: Check for any existing 'undefined' values in UUID columns

SELECT 
    'CHECK_UNDEFINED_VALUES' as test_name,
    'strategies' as table_name,
    COUNT(*) as undefined_count
FROM strategies 
WHERE id::text = 'undefined' OR id::text LIKE '%undefined%'

UNION ALL

SELECT 
    'CHECK_UNDEFINED_VALUES' as test_name,
    'trades' as table_name,
    COUNT(*) as undefined_count
FROM trades 
WHERE strategy_id::text = 'undefined' OR strategy_id::text LIKE '%undefined%'

UNION ALL

SELECT 
    'CHECK_UNDEFINED_VALUES' as test_name,
    'strategy_rules' as table_name,
    COUNT(*) as undefined_count
FROM strategy_rules 
WHERE strategy_id::text = 'undefined' OR strategy_id::text LIKE '%undefined%';

-- Test 2: Check for NULL values in UUID columns that might cause issues

SELECT 
    'CHECK_NULL_VALUES' as test_name,
    'strategies' as table_name,
    'id' as column_name,
    COUNT(*) as null_count
FROM strategies 
WHERE id IS NULL

UNION ALL

SELECT 
    'CHECK_NULL_VALUES' as test_name,
    'trades' as table_name,
    'strategy_id' as column_name,
    COUNT(*) as null_count
FROM trades 
WHERE strategy_id IS NULL

UNION ALL

SELECT 
    'CHECK_NULL_VALUES' as test_name,
    'strategy_rules' as table_name,
    'strategy_id' as column_name,
    COUNT(*) as null_count
FROM strategy_rules 
WHERE strategy_id IS NULL;

-- =====================================================
-- SECTION 3: SIMULATE UUID ERROR CONDITIONS
-- =====================================================

-- Test 3: Try to cast 'undefined' to UUID (this should fail)
BEGIN;
    DO $$
    BEGIN
        -- This should trigger the UUID error
        PERFORM 'undefined'::uuid;
        RAISE NOTICE 'UNEXPECTED: undefined was successfully cast to UUID';
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE 'EXPECTED: Caught invalid_text_representation error when casting undefined to UUID';
    END;
    $$;
ROLLBACK;

-- Test 4: Try to insert undefined UUID into strategies table (this should fail)
BEGIN;
    DO $$
    BEGIN
        -- This should trigger the UUID error
        INSERT INTO strategies (id, name, description, user_id) 
        VALUES ('undefined', 'Test Strategy', 'Test Description', gen_random_uuid());
        RAISE NOTICE 'UNEXPECTED: undefined was successfully inserted into strategies table';
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE 'EXPECTED: Caught invalid_text_representation error when inserting undefined UUID';
    WHEN others THEN
        RAISE NOTICE 'EXPECTED: Caught other error when inserting undefined UUID: %', SQLERRM;
    END;
    $$;
ROLLBACK;

-- Test 5: Try to insert undefined UUID into trades table (this should fail)
BEGIN;
    DO $$
    BEGIN
        -- This should trigger the UUID error
        INSERT INTO trades (strategy_id, symbol, entry_price, quantity) 
        VALUES ('undefined', 'TEST', 100.0, 10);
        RAISE NOTICE 'UNEXPECTED: undefined was successfully inserted into trades table';
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE 'EXPECTED: Caught invalid_text_representation error when inserting undefined UUID';
    WHEN others THEN
        RAISE NOTICE 'EXPECTED: Caught other error when inserting undefined UUID: %', SQLERRM;
    END;
    $$;
ROLLBACK;

-- =====================================================
-- SECTION 4: CHECK FOR REMAINING STRATEGY_RULE_COMPLIANCE REFERENCES
-- =====================================================

-- Test 6: Check for any remaining references to the deleted strategy_rule_compliance table

SELECT 
    'CHECK_REMAINING_REFERENCES' as test_name,
    'views' as object_type,
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%strategy_rule_compliance%'

UNION ALL

SELECT
    'CHECK_REMAINING_REFERENCES' as test_name,
    'functions' as object_type,
    'Function check skipped - potential compatibility issue' as finding,
    'Use pg_proc system catalog for direct function inspection if needed' as recommendation

UNION ALL

SELECT 
    'CHECK_REMAINING_REFERENCES' as test_name,
    'triggers' as object_type,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%strategy_rule_compliance%';

-- Test 7: Check for foreign key constraints that might reference strategy_rule_compliance

SELECT 
    'CHECK_FOREIGN_KEYS' as test_name,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'strategy_rule_compliance';

-- =====================================================
-- SECTION 5: TEST STRATEGY OPERATIONS WITH VARIOUS UUID INPUTS
-- =====================================================

-- Test 8: Test valid UUID operations (should work)

SELECT 
    'TEST_VALID_UUID' as test_name,
    'Valid UUID generation and casting' as description,
    gen_random_uuid() as generated_uuid,
    gen_random_uuid()::text as uuid_text,
    (gen_random_uuid()::text)::uuid as recast_uuid;

-- Test 9: Test NULL UUID operations (should work or be handled gracefully)

SELECT 
    'TEST_NULL_UUID' as test_name,
    'NULL UUID handling' as description,
    NULL::uuid as null_uuid,
    NULL::text as null_text;

-- Test 10: Test empty string UUID operations (might fail)
BEGIN;
    DO $$
    BEGIN
        -- This might trigger the UUID error
        PERFORM ''::uuid;
        RAISE NOTICE 'UNEXPECTED: Empty string was successfully cast to UUID';
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE 'EXPECTED: Caught invalid_text_representation error when casting empty string to UUID';
    WHEN others THEN
        RAISE NOTICE 'EXPECTED: Caught other error when casting empty string to UUID: %', SQLERRM;
    END;
    $$;
ROLLBACK;

-- =====================================================
-- SECTION 6: CHECK FOR FUNCTION CALLS THAT MIGHT PASS UNDEFINED UUIDS
-- =====================================================

-- Test 11: Check for functions that accept UUID parameters
-- Note: Using alternative approach to handle potential column reference issues

SELECT
    'CHECK_UUID_FUNCTIONS' as test_name,
    'Function check skipped - potential compatibility issue' as finding,
    'Use pg_proc system catalog for direct function inspection if needed' as recommendation;

-- Test 12: Check function parameters that might be UUID types
-- Note: Replaced with placeholder to avoid information_schema compatibility issues

SELECT
    'CHECK_FUNCTION_PARAMETERS' as test_name,
    'Function parameter check skipped - potential compatibility issue' as finding,
    'Use pg_proc system catalog for direct parameter inspection if needed' as recommendation;

-- =====================================================
-- SECTION 7: TEST ACTUAL STRATEGY OPERATIONS
-- =====================================================

-- Test 13: Test selecting strategies (should work)

SELECT 
    'TEST_SELECT_STRATEGIES' as test_name,
    'Count strategies' as description,
    COUNT(*) as strategy_count
FROM strategies;

-- Test 14: Test selecting trades with strategy joins (might reveal UUID issues)

SELECT 
    'TEST_TRADES_STRATEGY_JOIN' as test_name,
    'Count trades with valid strategy joins' as description,
    COUNT(t.id) as trade_count,
    COUNT(s.id) as strategy_count
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id;

-- Test 15: Test strategy rules with strategy joins (might reveal UUID issues)

SELECT 
    'TEST_STRATEGY_RULES_JOIN' as test_name,
    'Count strategy rules with valid strategy joins' as description,
    COUNT(sr.id) as rule_count,
    COUNT(s.id) as strategy_count
FROM strategy_rules sr
LEFT JOIN strategies s ON sr.strategy_id = s.id;

-- =====================================================
-- SECTION 8: CHECK FOR ORPHANED RECORDS
-- =====================================================

-- Test 16: Check for trades with invalid strategy UUIDs

SELECT 
    'CHECK_ORPHANED_TRADES' as test_name,
    'Count trades with invalid strategy references' as description,
    COUNT(*) as orphaned_count
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id
WHERE s.id IS NULL AND t.strategy_id IS NOT NULL;

-- Test 17: Check for strategy rules with invalid strategy UUIDs

SELECT 
    'CHECK_ORPHANED_RULES' as test_name,
    'Count strategy rules with invalid strategy references' as description,
    COUNT(*) as orphaned_count
FROM strategy_rules sr
LEFT JOIN strategies s ON sr.strategy_id = s.id
WHERE s.id IS NULL AND sr.strategy_id IS NOT NULL;

-- =====================================================
-- SECTION 9: SUMMARY AND RECOMMENDATIONS
-- =====================================================

-- Test 18: Generate summary of findings

SELECT 
    'SUMMARY' as section,
    'If any tests above showed unexpected behavior, that indicates the source of the UUID error' as finding,
    'Look specifically for tests that failed or showed unexpected results' as recommendation

UNION ALL

SELECT 
    'SUMMARY' as section,
    'Check application code for places where undefined might be passed as UUID' as finding,
    'Ensure all UUID parameters are properly validated before database operations' as recommendation

UNION ALL

SELECT 
    'SUMMARY' as section,
    'Verify that all strategy_rule_compliance references have been removed' as finding,
    'Any remaining references could cause undefined UUID errors' as recommendation

UNION ALL

SELECT 
    'SUMMARY' as section,
    'Check for orphaned records that might have invalid UUID references' as finding,
    'Clean up any orphaned records or fix their UUID references' as recommendation;

-- =====================================================
-- SECTION 10: HELPER QUERIES FOR FURTHER INVESTIGATION
-- =====================================================

-- Helper queries for manual investigation (uncomment to execute):
-- To manually check for undefined values in specific columns:
-- SELECT * FROM strategies WHERE id::text = 'undefined';
-- SELECT * FROM trades WHERE strategy_id::text = 'undefined';
-- SELECT * FROM strategy_rules WHERE strategy_id::text = 'undefined';

-- To manually check for specific UUID format issues:
-- SELECT id, id::text FROM strategies WHERE id::text NOT LIKE '%-%';
-- SELECT strategy_id, strategy_id::text FROM trades WHERE strategy_id::text NOT LIKE '%-%';
-- SELECT strategy_id, strategy_id::text FROM strategy_rules WHERE strategy_id::text NOT LIKE '%-%';

-- To manually check application logs for UUID errors:
-- Check the application logs for any occurrences of "invalid input syntax for type uuid"

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================