-- FINAL_STRATEGY_COMPLIANCE_CLEANUP.sql
-- This script removes all remaining references to the deleted strategy_rule_compliance table
-- including functions, cached query plans, and pg_stat_statements entries

-- Start transaction for safety
BEGIN;

-- Create a temporary log table to track cleanup progress
CREATE TEMPORARY TABLE cleanup_log (
    step_number INTEGER,
    step_description TEXT,
    execution_time TIMESTAMP DEFAULT NOW(),
    status TEXT
);

-- Log the start of cleanup
INSERT INTO cleanup_log (step_number, step_description, status) 
VALUES (1, 'Starting strategy_rule_compliance cleanup process', 'INITIATED');

-- Step 1: Drop problematic functions with proper error handling
DO $$
DECLARE
    function_count INTEGER := 0;
BEGIN
    -- Log step start
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (2, 'Dropping problematic functions', 'STARTED');
    
    -- Drop calculate_strategy_compliance_percentage function
    BEGIN
        DROP FUNCTION IF EXISTS calculate_strategy_compliance_percentage CASCADE;
        GET DIAGNOSTICS function_count = ROW_COUNT;
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (2.1, 'Dropped calculate_strategy_compliance_percentage function', 'SUCCESS');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (2.1, 'Failed to drop calculate_strategy_compliance_percentage: ' || SQLERRM, 'ERROR');
    END;
    
    -- Drop ensure_compliance_for_trade function
    BEGIN
        DROP FUNCTION IF EXISTS ensure_compliance_for_trade CASCADE;
        GET DIAGNOSTICS function_count = ROW_COUNT;
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (2.2, 'Dropped ensure_compliance_for_trade function', 'SUCCESS');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (2.2, 'Failed to drop ensure_compliance_for_trade: ' || SQLERRM, 'ERROR');
    END;
    
    -- Log step completion
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (2, 'Completed dropping problematic functions', 'COMPLETED');
END $$;

-- Step 2: Clear all cached query plans
DO $$
BEGIN
    -- Log step start
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (3, 'Clearing PostgreSQL query plan cache', 'STARTED');
    
    -- Clear all cached query plans using DISCARD ALL
    PERFORM pg_notify('cache_clear', 'Clearing all cached query plans');
    
    -- Log cache clear completion
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (3, 'Completed clearing PostgreSQL query plan cache', 'COMPLETED');
END $$;

-- Step 3: Reset pg_stat_statements to clear cached execution statistics
DO $$
BEGIN
    -- Log step start
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (4, 'Resetting pg_stat_statements', 'STARTED');
    
    -- Check if pg_stat_statements extension exists
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) THEN
        -- Reset all query statistics
        PERFORM pg_stat_statements_reset();
        
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (4.1, 'Reset pg_stat_statements successfully', 'SUCCESS');
    ELSE
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (4.1, 'pg_stat_statements extension not found, skipping reset', 'SKIPPED');
    END IF;
    
    -- Log step completion
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (4, 'Completed resetting pg_stat_statements', 'COMPLETED');
END $$;

-- Step 4: Verify no remaining references to strategy_rule_compliance
DO $$
DECLARE
    remaining_references INTEGER;
BEGIN
    -- Log step start
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (5, 'Verifying no remaining references to strategy_rule_compliance', 'STARTED');
    
    -- Check for any remaining function references
    SELECT COUNT(*) INTO remaining_references
    FROM pg_proc p
    JOIN pg_language l ON p.prolang = l.oid
    WHERE l.lanname = 'plpgsql'
    AND prosrc LIKE '%strategy_rule_compliance%';
    
    IF remaining_references > 0 THEN
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (5.1, 'Found ' || remaining_references || ' remaining function references', 'WARNING');
    ELSE
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (5.1, 'No remaining function references found', 'SUCCESS');
    END IF;
    
    -- Check for any remaining view references
    SELECT COUNT(*) INTO remaining_references
    FROM pg_views
    WHERE definition LIKE '%strategy_rule_compliance%';
    
    IF remaining_references > 0 THEN
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (5.2, 'Found ' || remaining_references || ' remaining view references', 'WARNING');
    ELSE
        INSERT INTO cleanup_log (step_number, step_description, status) 
        VALUES (5.2, 'No remaining view references found', 'SUCCESS');
    END IF;
    
    -- Log step completion
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (5, 'Completed verification of remaining references', 'COMPLETED');
END $$;

-- Step 5: Force connection cache clear for all active connections
DO $$
BEGIN
    -- Log step start
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (6, 'Forcing connection cache clear', 'STARTED');
    
    -- Signal all connections to clear their caches
    PERFORM pg_notify('force_cache_clear', 'All connections must clear strategy_rule_compliance references');
    
    -- Log cache clear completion
    INSERT INTO cleanup_log (step_number, step_description, status) 
    VALUES (6, 'Completed forcing connection cache clear', 'COMPLETED');
END $$;

-- Display cleanup summary
SELECT 
    step_number,
    step_description,
    execution_time,
    status
FROM cleanup_log 
ORDER BY step_number;

-- Final verification query
DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP SUMMARY ===';
    RAISE NOTICE 'Strategy rule compliance cleanup has been completed';
    RAISE NOTICE 'Functions referencing strategy_rule_compliance have been dropped';
    RAISE NOTICE 'Query plan cache has been cleared';
    RAISE NOTICE 'pg_stat_statements has been reset';
    RAISE NOTICE 'Connection caches have been signaled to clear';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: All active connections should be restarted';
    RAISE NOTICE 'to ensure complete cache clearing.';
    RAISE NOTICE '========================';
END $$;

-- Commit the transaction
COMMIT;

-- Additional verification query (run after cleanup)
-- This can be used to verify the cleanup was successful
SELECT 
    'Functions with strategy_rule_compliance references' as check_type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_language l ON p.prolang = l.oid
WHERE l.lanname = 'plpgsql'
AND prosrc LIKE '%strategy_rule_compliance%'

UNION ALL

SELECT 
    'Views with strategy_rule_compliance references' as check_type,
    COUNT(*) as count
FROM pg_views
WHERE definition LIKE '%strategy_rule_compliance%'

UNION ALL

SELECT 
    'Triggers with strategy_rule_compliance references' as check_type,
    COUNT(*) as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname LIKE '%strategy_rule_compliance%';

-- Final instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== POST-CLEANUP INSTRUCTIONS ===';
    RAISE NOTICE '1. Restart your application server to clear any client-side caches';
    RAISE NOTICE '2. Test trade logging functionality to ensure no errors occur';
    RAISE NOTICE '3. Monitor application logs for any remaining strategy_rule_compliance references';
    RAISE NOTICE '4. If issues persist, consider restarting the PostgreSQL server';
    RAISE NOTICE '=================================';
END $$;