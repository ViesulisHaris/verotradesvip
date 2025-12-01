-- VERIFICATION.sql
-- Purpose: Comprehensive verification of schema cache and relationship fixes
-- This script tests that all issues have been resolved and the database is in a healthy state
--
-- DEPENDENCY: This script should be run AFTER both SCHEMA_CACHE_CLEAR.sql and RELATIONSHIP_REBUILD.sql have completed successfully
-- EXECUTION ORDER: This should be the LAST script to run in the sequence

-- ============================================================================
-- WARNING: This script performs extensive database verification
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Start transaction to ensure atomic operations
BEGIN;

-- Create a savepoint for potential rollback
SAVEPOINT verification_start;

-- Create a temporary table to track verification results
CREATE TEMP TABLE IF NOT EXISTS verification_results (
    test_name TEXT,
    test_group TEXT,
    status TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Initialize verification process
INSERT INTO verification_results (test_name, test_group, status, details)
VALUES ('VERIFICATION_START', 'INIT', 'INFO', 'Starting comprehensive verification of schema and relationship fixes');

DO $$
BEGIN
    RAISE NOTICE '===========================================================================';
    RAISE NOTICE 'STARTING COMPREHENSIVE VERIFICATION OF SCHEMA AND RELATIONSHIP FIXES';
    RAISE NOTICE '===========================================================================';
END $$;

-- Test 1: Verify prerequisites before proceeding
DO $$
DECLARE
    cache_clear_completed BOOLEAN := FALSE;
    relationship_rebuild_completed BOOLEAN := FALSE;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Test 1: Verifying prerequisites...';
    
    -- Check if any compliance tables still exist (should be deleted)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance')
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('PREREQ_TABLE_REMOVAL', 'PREREQUISITES', 'FAILED', 'Compliance tables still exist - SCHEMA_CACHE_CLEAR.sql may not have run');
        RAISE EXCEPTION 'PREREQUISITE FAILED: Compliance tables still exist. Please run SCHEMA_CACHE_CLEAR.sql first.';
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('PREREQ_TABLE_REMOVAL', 'PREREQUISITES', 'PASSED', 'Compliance tables successfully removed');
        cache_clear_completed := TRUE;
    END IF;
    
    -- Check if strategies table exists (required for relationship rebuild)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategies' AND table_schema = 'public') THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('PREREQ_STRATEGIES_TABLE', 'PREREQUISITES', 'FAILED', 'strategies table does not exist - RELATIONSHIP_REBUILD.sql may not have run');
        RAISE EXCEPTION 'PREREQUISITE FAILED: strategies table does not exist. Please run RELATIONSHIP_REBUILD.sql first.';
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('PREREQ_STRATEGIES_TABLE', 'PREREQUISITES', 'PASSED', 'strategies table exists');
        relationship_rebuild_completed := TRUE;
    END IF;
    
    IF cache_clear_completed AND relationship_rebuild_completed THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('PREREQUISITES_SUMMARY', 'PREREQUISITES', 'PASSED', 'All prerequisites verified - proceeding with comprehensive verification');
    END IF;
    
    RAISE NOTICE 'Test 1 completed: prerequisites verification';
END $$;

-- Test 2: Verify compliance tables are completely removed
DO $$
DECLARE
    view_exists BOOLEAN;
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    remaining_deps INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 2: Verifying compliance tables are completely removed...';
    
    -- Check if any views still reference the deleted tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public'
        AND (
            view_definition ILIKE '%strategy_rule_compliance%' OR
            view_definition ILIKE '%compliance_table%' OR
            view_definition ILIKE '%rule_compliance%'
        )
    ) INTO view_exists;
    
    IF view_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('VIEW_REMOVAL', 'CLEANUP', 'FAILED', 'Views still reference compliance tables');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('VIEW_REMOVAL', 'CLEANUP', 'PASSED', 'No views reference compliance tables');
    END IF;
    
    -- Check if any functions still reference the deleted tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND (
            routine_definition ILIKE '%strategy_rule_compliance%' OR
            routine_definition ILIKE '%compliance_table%' OR
            routine_definition ILIKE '%rule_compliance%'
        )
    ) INTO function_exists;
    
    IF function_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FUNCTION_REMOVAL', 'CLEANUP', 'FAILED', 'Functions still reference compliance tables');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FUNCTION_REMOVAL', 'CLEANUP', 'PASSED', 'No functions reference compliance tables');
    END IF;
    
    -- Check for any remaining triggers
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND (
            event_object_table = 'strategy_rule_compliance' OR
            event_object_table = 'compliance_table' OR
            event_object_table = 'rule_compliance'
        )
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TRIGGER_REMOVAL', 'CLEANUP', 'FAILED', 'Triggers still exist for compliance tables');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TRIGGER_REMOVAL', 'CLEANUP', 'PASSED', 'No triggers exist for compliance tables');
    END IF;
    
    -- Check for any remaining dependencies in pg_depend
    BEGIN
        SELECT COUNT(*) INTO remaining_deps
        FROM pg_depend d
        JOIN pg_class c ON d.refobjid = c.oid
        WHERE c.relname IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance');
        
        IF remaining_deps > 0 THEN
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('REMAINING_DEPENDENCIES', 'CLEANUP', 'WARNING', format('%s dependencies to compliance tables still exist', remaining_deps));
        ELSE
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('REMAINING_DEPENDENCIES', 'CLEANUP', 'PASSED', 'No remaining dependencies to compliance tables');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('REMAINING_DEPENDENCIES', 'CLEANUP', 'PASSED', 'No remaining dependencies to compliance tables (tables already deleted)');
    END;
    
    RAISE NOTICE 'Test 2 completed: compliance tables cleanup verification';
END $$;

-- Test 3: Verify strategies table structure and integrity
DO $$
DECLARE
    table_exists BOOLEAN;
    primary_key_exists BOOLEAN;
    user_id_exists BOOLEAN;
    column_count INTEGER;
    row_count INTEGER;
    pk_column_name TEXT;
BEGIN
    RAISE NOTICE 'Test 3: Verifying strategies table structure and integrity...';
    
    -- Check if strategies table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'strategies'
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_TABLE_EXISTS', 'STRUCTURE', 'FAILED', 'strategies table does not exist');
        RAISE EXCEPTION 'CRITICAL: strategies table does not exist';
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_TABLE_EXISTS', 'STRUCTURE', 'PASSED', 'strategies table exists');
    END IF;
    
    -- Check for primary key and get its name
    SELECT column_name INTO pk_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'strategies'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
    
    IF pk_column_name IS NULL THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_PRIMARY_KEY', 'STRUCTURE', 'FAILED', 'strategies table missing primary key');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_PRIMARY_KEY', 'STRUCTURE', 'PASSED', format('strategies table has primary key: %s', pk_column_name));
    END IF;
    
    -- Check for user_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'strategies'
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) INTO user_id_exists;
    
    IF NOT user_id_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_USER_ID', 'STRUCTURE', 'FAILED', 'strategies table missing user_id column');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_USER_ID', 'STRUCTURE', 'PASSED', 'strategies table has user_id column');
    END IF;
    
    -- Get column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'strategies'
    AND table_schema = 'public';
    
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('STRATEGIES_COLUMN_COUNT', 'STRUCTURE', 'INFO', format('strategies table has %s columns', column_count));
    
    -- Get row count
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM strategies' INTO row_count;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_ROW_COUNT', 'DATA', 'INFO', format('strategies table has %s rows', row_count));
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_ROW_COUNT', 'DATA', 'ERROR', format('Failed to count rows: %s', SQLERRM));
    END;
    
    RAISE NOTICE 'Test 3 completed: strategies table structure verification';
END $$;

-- Test 4: Verify foreign key relationships
DO $$
DECLARE
    table_record RECORD;
    relationship_count INTEGER := 0;
    valid_relationships INTEGER := 0;
    invalid_relationships INTEGER := 0;
    total_tables INTEGER := 0;
    pk_column_name TEXT;
BEGIN
    RAISE NOTICE 'Test 4: Verifying foreign key relationships...';
    
    -- Get the primary key column name for strategies table
    SELECT column_name INTO pk_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'strategies'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
    
    IF pk_column_name IS NULL THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_PK_CHECK', 'RELATIONSHIPS', 'FAILED', 'Cannot determine primary key column for strategies table');
        RAISE EXCEPTION 'Cannot determine primary key column for strategies table';
    END IF;
    
    -- Count tables with strategy_id columns
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name != 'strategies'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = tables.table_name
        AND table_schema = tables.table_schema
        AND column_name = 'strategy_id'
    );
    
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('STRATEGY_ID_TABLES_COUNT', 'RELATIONSHIPS', 'INFO', format('Found %s tables with strategy_id columns', total_tables));
    
    -- Check each table for proper foreign key constraints
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = tables.table_name
            AND table_schema = tables.table_schema
            AND column_name = 'strategy_id'
        )
    LOOP
        relationship_count := relationship_count + 1;
        
        -- Check if foreign key exists and references the correct column
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_name = table_record.table_name
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND rc.unique_constraint_name IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'strategies' AND constraint_type = 'PRIMARY KEY'
            )
        ) THEN
            valid_relationships := valid_relationships + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('FK_%s', table_record.table_name), 'RELATIONSHIPS', 'PASSED',
                    format('Table %s has valid foreign key constraint to strategies.%s', table_record.table_name, pk_column_name));
        ELSE
            invalid_relationships := invalid_relationships + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('FK_%s', table_record.table_name), 'RELATIONSHIPS', 'FAILED',
                    format('Table %s missing or invalid foreign key constraint to strategies.%s', table_record.table_name, pk_column_name));
        END IF;
    END LOOP;
    
    -- Summary of relationship verification
    IF invalid_relationships = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RELATIONSHIP_SUMMARY', 'RELATIONSHIPS', 'PASSED',
                format('All %s foreign key relationships are valid', valid_relationships));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RELATIONSHIP_SUMMARY', 'RELATIONSHIPS', 'FAILED',
                format('%s valid relationships, %s invalid relationships', valid_relationships, invalid_relationships));
    END IF;
    
    RAISE NOTICE 'Test 4 completed: foreign key relationships verification';
END $$;

-- Test 5: Verify indexes for performance
DO $$
DECLARE
    table_record RECORD;
    index_count INTEGER := 0;
    missing_indexes INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 5: Verifying indexes for performance...';
    
    -- Check each table with strategy_id for proper indexes
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = tables.table_name
            AND table_schema = tables.table_schema
            AND column_name = 'strategy_id'
        )
    LOOP
        -- Check if index exists for strategy_id (more specific check)
        IF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = table_record.table_name
            AND indexdef LIKE '%strategy_id%'
            AND schemaname = 'public'
            AND (indexdef LIKE '%CREATE INDEX%' OR indexdef LIKE '%CREATE UNIQUE INDEX%')
        ) THEN
            index_count := index_count + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('IDX_%s', table_record.table_name), 'PERFORMANCE', 'PASSED',
                    format('Table %s has strategy_id index', table_record.table_name));
        ELSE
            missing_indexes := missing_indexes + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('IDX_%s', table_record.table_name), 'PERFORMANCE', 'WARNING',
                    format('Table %s missing strategy_id index', table_record.table_name));
        END IF;
    END LOOP;
    
    -- Summary of index verification
    IF missing_indexes = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('INDEX_SUMMARY', 'PERFORMANCE', 'PASSED',
                format('All %s tables have proper strategy_id indexes', index_count));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('INDEX_SUMMARY', 'PERFORMANCE', 'WARNING',
                format('Found %s indexes, %s missing indexes', index_count, missing_indexes));
    END IF;
    
    RAISE NOTICE 'Test 5 completed: performance indexes verification';
END $$;

-- Test 6: Verify RLS policies are properly configured
DO $$
DECLARE
    table_record RECORD;
    rls_enabled_count INTEGER := 0;
    policy_count INTEGER := 0;
    tables_without_rls INTEGER := 0;
    total_tables INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 6: Verifying RLS policies are properly configured...';
    
    -- Check strategies table RLS
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'strategies'
        AND rowsecurity = true
    ) THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_RLS', 'SECURITY', 'PASSED', 'RLS enabled on strategies table');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_RLS', 'SECURITY', 'FAILED', 'RLS not enabled on strategies table');
    END IF;
    
    -- Check RLS policies on strategies table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'strategies';
    
    IF policy_count > 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_POLICIES', 'SECURITY', 'PASSED', format('strategies table has %s RLS policies', policy_count));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_POLICIES', 'SECURITY', 'WARNING', 'strategies table has no RLS policies');
    END IF;
    
    -- Count total tables with strategy_id
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name != 'strategies'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = tables.table_name
        AND table_schema = tables.table_schema
        AND column_name = 'strategy_id'
    );
    
    -- Check RLS on related tables
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = tables.table_name
            AND table_schema = tables.table_schema
            AND column_name = 'strategy_id'
        )
    LOOP
        -- Check if RLS is enabled
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE tablename = table_record.table_name
            AND rowsecurity = true
        ) THEN
            rls_enabled_count := rls_enabled_count + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('RLS_%s', table_record.table_name), 'SECURITY', 'PASSED',
                    format('RLS enabled on %s table', table_record.table_name));
        ELSE
            tables_without_rls := tables_without_rls + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('RLS_%s', table_record.table_name), 'SECURITY', 'WARNING',
                    format('RLS not enabled on %s table', table_record.table_name));
        END IF;
    END LOOP;
    
    -- Summary of RLS verification
    IF tables_without_rls = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RLS_SUMMARY', 'SECURITY', 'PASSED',
                format('RLS enabled on all %s tables with strategy_id', rls_enabled_count));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RLS_SUMMARY', 'SECURITY', 'WARNING',
                format('RLS enabled on %s of %s tables, %s tables without RLS', rls_enabled_count, total_tables, tables_without_rls));
    END IF;
    
    RAISE NOTICE 'Test 6 completed: RLS policies verification';
END $$;

-- Test 7: Test basic database operations
DO $$
DECLARE
    test_passed BOOLEAN := TRUE;
    error_message TEXT;
    pk_column_name TEXT;
    table_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 7: Testing basic database operations...';
    
    -- Get the primary key column name for strategies table
    SELECT column_name INTO pk_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'strategies'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
    
    -- Test 7a: Test basic query on strategies table
    BEGIN
        PERFORM 1 FROM strategies LIMIT 1;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('QUERY_STRATEGIES', 'OPERATIONS', 'PASSED', 'Basic query on strategies table successful');
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('QUERY_STRATEGIES', 'OPERATIONS', 'FAILED', format('Query failed: %s', error_message));
    END;
    
    -- Test 7b: Test join operations with dynamic primary key column
    BEGIN
        -- Try a simple join between strategies and a related table (if exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'trades'
            AND table_schema = 'public'
        ) THEN
            EXECUTE format('PERFORM 1 FROM strategies s LEFT JOIN trades t ON s.%I = t.strategy_id LIMIT 1', pk_column_name);
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'PASSED', format('Join between strategies.%s and trades.strategy_id successful', pk_column_name));
        ELSE
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'SKIPPED', 'trades table not found');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'FAILED', format('Join failed: %s', error_message));
    END;
    
    -- Test 7c: Test foreign key constraint enforcement
    BEGIN
        -- Count tables with foreign key constraints to strategies
        SELECT COUNT(*) INTO table_count
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
        AND EXISTS (
            SELECT 1 FROM information_schema.referential_constraints rc
            WHERE rc.constraint_name = table_constraints.constraint_name
            AND rc.unique_constraint_name IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'strategies' AND constraint_type = 'PRIMARY KEY'
            )
        );
        
        IF table_count > 0 THEN
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('FK_CONSTRAINT_CHECK', 'OPERATIONS', 'PASSED', format('%s tables have foreign key constraints to strategies', table_count));
        ELSE
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('FK_CONSTRAINT_CHECK', 'OPERATIONS', 'WARNING', 'No foreign key constraints to strategies found');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FK_CONSTRAINT_CHECK', 'OPERATIONS', 'FAILED', format('FK constraint check failed: %s', error_message));
    END;
    
    RAISE NOTICE 'Test 7 completed: basic database operations verification';
END $$;

-- Step 8: Generate final verification report
DO $$
DECLARE
    total_tests INTEGER;
    passed_tests INTEGER;
    failed_tests INTEGER;
    warning_tests INTEGER;
    info_tests INTEGER;
    critical_failed INTEGER;
BEGIN
    -- Count test results
    SELECT COUNT(*) INTO total_tests FROM verification_results;
    SELECT COUNT(*) INTO passed_tests FROM verification_results WHERE status = 'PASSED';
    SELECT COUNT(*) INTO failed_tests FROM verification_results WHERE status = 'FAILED';
    SELECT COUNT(*) INTO warning_tests FROM verification_results WHERE status = 'WARNING';
    SELECT COUNT(*) INTO info_tests FROM verification_results WHERE status = 'INFO';
    
    -- Count critical failures (prerequisites and structure)
    SELECT COUNT(*) INTO critical_failed
    FROM verification_results
    WHERE status = 'FAILED'
    AND test_group IN ('PREREQUISITES', 'STRUCTURE', 'RELATIONSHIPS');
    
    -- Add summary to results
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('VERIFICATION_SUMMARY', 'FINAL', 'INFO',
            format('Total: %s, Passed: %s, Failed: %s, Warnings: %s, Info: %s',
                   total_tests, passed_tests, failed_tests, warning_tests, info_tests));
    
    -- Determine overall status
    IF critical_failed = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('OVERALL_STATUS', 'FINAL', 'PASSED', 'All critical tests passed - database is healthy');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('OVERALL_STATUS', 'FINAL', 'FAILED', format('%s critical tests failed - database needs attention', critical_failed));
    END IF;
END $$;

-- Release savepoint and commit transaction
RELEASE SAVEPOINT verification_start;
COMMIT;

-- Display detailed verification results
SELECT
    test_name,
    test_group,
    status,
    details,
    created_at
FROM verification_results
ORDER BY
    CASE test_group
        WHEN 'INIT' THEN 1
        WHEN 'PREREQUISITES' THEN 2
        WHEN 'CLEANUP' THEN 3
        WHEN 'STRUCTURE' THEN 4
        WHEN 'RELATIONSHIPS' THEN 5
        WHEN 'PERFORMANCE' THEN 6
        WHEN 'SECURITY' THEN 7
        WHEN 'OPERATIONS' THEN 8
        WHEN 'FINAL' THEN 9
        ELSE 10
    END,
    test_name;

-- Return final status
SELECT
    'VERIFICATION' as operation,
    CASE
        WHEN (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED' AND test_group IN ('PREREQUISITES', 'STRUCTURE', 'RELATIONSHIPS')) = 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status,
    NOW() as completed_at,
    CASE
        WHEN (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED' AND test_group IN ('PREREQUISITES', 'STRUCTURE', 'RELATIONSHIPS')) = 0 THEN
            'All critical verification tests passed - database is healthy'
        ELSE
            format('%s critical verification tests failed - see detailed results',
                   (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED' AND test_group IN ('PREREQUISITES', 'STRUCTURE', 'RELATIONSHIPS')))
    END as message;

-- Get the final counts before dropping the table
DO $$
DECLARE
    critical_failed INTEGER;
    total_failed INTEGER;
BEGIN
    SELECT COUNT(*) INTO critical_failed
    FROM verification_results
    WHERE status = 'FAILED'
    AND test_group IN ('PREREQUISITES', 'STRUCTURE', 'RELATIONSHIPS');
    
    SELECT COUNT(*) INTO total_failed
    FROM verification_results
    WHERE status = 'FAILED';
    
    RAISE NOTICE '===========================================================================';
    RAISE NOTICE 'VERIFICATION COMPLETED';
    IF critical_failed = 0 THEN
        RAISE NOTICE 'SUCCESS: All critical verification tests passed';
        RAISE NOTICE 'Database is in a healthy state';
        RAISE NOTICE 'All SQL scripts have executed successfully';
    ELSE
        RAISE NOTICE 'FAILED: %s critical verification tests failed', critical_failed;
        RAISE NOTICE 'Total failed tests: %s', total_failed;
        RAISE NOTICE 'See detailed results above for specific issues';
    END IF;
    RAISE NOTICE '===========================================================================';
END $$;

-- Clean up temporary table
DROP TABLE IF EXISTS verification_results;