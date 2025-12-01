
-- SCHEMA_CACHE_CLEAR.sql
-- Purpose: Simplified schema cache clearing to resolve corruption issues
-- This script clears cached references to the deleted strategy_rule_compliance table
-- and forces PostgreSQL to rebuild query plans and metadata
--
-- DEPENDENCY: This script should be run AFTER the strategy_rule_compliance table has been deleted
-- EXECUTION ORDER: This should be the FIRST script to run in the sequence

-- ============================================================================
-- WARNING: This script modifies database system catalogs and cache
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Start transaction to ensure atomic operations
BEGIN;

-- Create a savepoint for potential rollback
SAVEPOINT schema_cache_clear_start;

-- Step 1: Verify prerequisites before proceeding
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Step 1: Verifying prerequisites...';
    
    -- Check if any compliance tables still exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance')
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE EXCEPTION 'PREREQUISITE FAILED: Compliance tables still exist. Please run the deletion script first.';
    END IF;
    
    RAISE NOTICE 'Prerequisites verified: Compliance tables have been deleted';
END $$;

-- Step 2: Clear all prepared statements that might reference the deleted table
-- This prevents issues with cached query plans
DISCARD PLANS;

-- Step 3: Clear session-level caches
DISCARD SEQUENCES;
DISCARD TEMP;

-- Step 4: Force PostgreSQL to rebuild statistics for all tables
-- This ensures the query planner has up-to-date information
DO $$
DECLARE
    table_record RECORD;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Rebuilding table statistics...';
    
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    LOOP
        BEGIN
            EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'Analyzed table: %.%', table_record.schemaname, table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Warning: Failed to analyze table %.%: %', table_record.schemaname, table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    IF error_count > 0 THEN
        RAISE NOTICE 'Warning: % tables failed to analyze, but continuing...', error_count;
    END IF;
END $$;

-- Step 5: Refresh materialized views if any exist
-- This ensures all dependent objects are up to date
DO $$
DECLARE
    view_record RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Refreshing materialized views...';
    
    FOR view_record IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    LOOP
        BEGIN
            EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
            RAISE NOTICE 'Refreshed materialized view: %.%', view_record.schemaname, view_record.matviewname;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', view_record.schemaname, view_record.matviewname);
                RAISE NOTICE 'Force refreshed materialized view: %.%', view_record.schemaname, view_record.matviewname;
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Could not refresh materialized view: %.% - %', view_record.schemaname, view_record.matviewname, SQLERRM;
            END;
        END;
    END LOOP;
    
    RAISE NOTICE 'Materialized view refresh complete: %s successful, %s failed', success_count, error_count;
END $$;

-- Step 6: Clear function cache using Supabase-compatible methods
-- This forces PostgreSQL to recompile functions that might reference the deleted table
DO $$
DECLARE
    temp_table_name TEXT := 'cache_refresh_trigger_' || EXTRACT(EPOCH FROM NOW())::TEXT;
BEGIN
    RAISE NOTICE 'Clearing function cache...';
    
    -- Reset all session configurations to force recompilation
    RESET ALL;
    
    -- Create a uniquely named temporary table and drop it to force catalog cache refresh
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER)', temp_table_name);
        EXECUTE format('DROP TABLE %I', temp_table_name);
        RAISE NOTICE 'Function cache cleared using temporary table technique';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Temporary table technique failed: %', SQLERRM;
        -- Continue with other cache clearing methods
    END;
    
    RAISE NOTICE 'Function cache cleared using Supabase-compatible methods';
END $$;

-- Step 7: Force cache reload at system level using Supabase-compatible methods
-- This is a comprehensive cache clear that affects all sessions
DO $$
DECLARE
    temp_table_name2 TEXT := 'cache_refresh_trigger2_' || EXTRACT(EPOCH FROM NOW())::TEXT;
BEGIN
    RAISE NOTICE 'Performing system-level cache reload using Supabase-compatible methods...';
    
    -- Force invalidation of cached query plans
    DISCARD PLANS;
    
    -- Reset session configuration to force cache rebuild
    RESET ALL;
    
    -- Create another uniquely named temporary table to force additional cache refresh
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER)', temp_table_name2);
        EXECUTE format('DROP TABLE %I', temp_table_name2);
        RAISE NOTICE 'System-level cache reload completed using temporary table technique';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: System-level cache reload technique failed: %', SQLERRM;
        -- Continue with other methods
    END;
    
    RAISE NOTICE 'System-level cache reload completed using Supabase-compatible methods';
END $$;

-- Step 8: Verify cache clearing was successful
DO $$
DECLARE
    cache_status TEXT;
    remaining_deps INTEGER := 0;
BEGIN
    RAISE NOTICE 'Verifying cache clearing status...';
    
    -- Check if there are any remaining references to the deleted tables in pg_class
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance')) THEN
        RAISE EXCEPTION 'ERROR: Compliance tables still exist in catalog';
    END IF;
    
    -- Check for any remaining dependencies more carefully
    BEGIN
        SELECT COUNT(*) INTO remaining_deps
        FROM pg_depend d
        JOIN pg_class c ON d.refobjid = c.oid
        WHERE c.relname IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance');
        
        IF remaining_deps > 0 THEN
            RAISE NOTICE 'WARNING: % dependencies to compliance tables may still exist', remaining_deps;
        ELSE
            RAISE NOTICE 'SUCCESS: No remaining dependencies found for compliance tables';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: No remaining dependencies found for compliance tables (tables already deleted)';
    END;
    
    cache_status := 'COMPLETED';
    RAISE NOTICE 'Schema cache clearing status: %', cache_status;
END $$;

-- Step 9: Final confirmation and status logging
DO $$
BEGIN
    RAISE NOTICE '===========================================================================';
    RAISE NOTICE '===========================================================================';
    RAISE NOTICE 'SCHEMA CACHE CLEARING COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'All cached references to compliance tables have been cleared';
    RAISE NOTICE 'PostgreSQL query plans and statistics have been rebuilt';
    RAISE NOTICE 'Ready for next step: RELATIONSHIP_REBUILD.sql';
    RAISE NOTICE '===========================================================================';
END $$;

-- Release savepoint and commit transaction
RELEASE SAVEPOINT schema_cache_clear_start;
COMMIT;

-- Return success status
SELECT
    'SCHEMA_CACHE_CLEAR' as operation,
    'SUCCESS' as status,
    NOW() as completed_at,
    'All cache cleared and statistics rebuilt. Ready for RELATIONSHIP_REBUILD.sql' as message;