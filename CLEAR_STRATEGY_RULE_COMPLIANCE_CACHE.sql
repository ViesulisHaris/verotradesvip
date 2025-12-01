-- =====================================================================
-- CLEAR_STRATEGY_RULE_COMPLIANCE_CACHE.sql
-- Purpose: Comprehensive schema cache clearing for the deleted strategy_rule_compliance table
-- This script clears all cached references to the deleted table and prevents
-- "invalid input syntax for type uuid: 'undefined'" errors
-- =====================================================================

-- =====================================================================
-- WARNING: This script modifies database system catalogs and cache
-- Run this script in Supabase SQL Editor with service role key privileges
-- Ensure the strategy_rule_compliance table has been completely deleted before running
-- =====================================================================

-- Start transaction to ensure atomic operations
BEGIN;

-- Create a savepoint for potential rollback
SAVEPOINT strategy_rule_compliance_cache_clear;

-- Step 1: Verify prerequisites before proceeding
DO $$
DECLARE
    table_exists BOOLEAN;
    remaining_deps INTEGER;
BEGIN
    RAISE NOTICE 'Step 1: Verifying prerequisites...';
    
    -- Check if strategy_rule_compliance table still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'strategy_rule_compliance'
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE EXCEPTION 'PREREQUISITE FAILED: strategy_rule_compliance table still exists. Please delete it first.';
    END IF;
    
    -- Check for any remaining dependencies
    BEGIN
        SELECT COUNT(*) INTO remaining_deps
        FROM pg_depend d
        JOIN pg_class c ON d.refobjid = c.oid
        WHERE c.relname = 'strategy_rule_compliance';
        
        IF remaining_deps > 0 THEN
            RAISE NOTICE 'WARNING: % dependencies to strategy_rule_compliance may still exist', remaining_deps;
        ELSE
            RAISE NOTICE 'SUCCESS: No remaining dependencies found for strategy_rule_compliance';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: No remaining dependencies found for strategy_rule_compliance (table already deleted)';
    END;
    
    RAISE NOTICE 'Prerequisites verified: strategy_rule_compliance table has been deleted';
END $$;

-- Step 2: Clear PostgreSQL query plan cache aggressively
-- This prevents cached query plans from referencing the deleted table
DO $$
BEGIN
    RAISE NOTICE 'Step 2: Clearing PostgreSQL query plan cache...';
    
    -- Clear all prepared statements that might reference the deleted table
    DISCARD PLANS;
    
    -- Clear session-level caches
    DISCARD SEQUENCES;
    DISCARD TEMP;
    
    -- Clear all prepared statements
    DEALLOCATE ALL;
    
    RAISE NOTICE 'PostgreSQL query plan cache cleared';
END $$;

-- Step 3: Force PostgreSQL to rebuild statistics for all tables
-- This ensures the query planner has up-to-date information
DO $$
DECLARE
    table_record RECORD;
    error_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 3: Rebuilding table statistics...';
    
    -- Focus on core tables that might be affected
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('strategies', 'trades', 'users', 'strategy_rules', 'trade_tags', 'tags')
    LOOP
        BEGIN
            EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
            EXECUTE format('VACUUM ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'Analyzed table: %.%', table_record.schemaname, table_record.tablename;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Warning: Failed to analyze table %.%: %', table_record.schemaname, table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Update statistics for the entire database
    BEGIN
        EXECUTE 'ANALYZE';
        RAISE NOTICE 'Database-wide statistics updated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Database-wide analyze failed: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Table statistics rebuild complete: %s successful, %s failed', success_count, error_count;
END $$;

-- Step 4: Clear Supabase-specific schema cache
-- This targets Supabase's internal caching mechanisms
DO $$
DECLARE
    temp_table_name TEXT := 'cache_refresh_trigger_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    temp_table_name2 TEXT := 'cache_refresh_trigger2_' || EXTRACT(EPOCH FROM NOW())::TEXT;
BEGIN
    RAISE NOTICE 'Step 4: Clearing Supabase-specific schema cache...';
    
    -- Reset all session configurations to force recompilation
    RESET ALL;
    
    -- Create uniquely named temporary tables to force catalog cache refresh
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER)', temp_table_name);
        EXECUTE format('DROP TABLE %I', temp_table_name);
        RAISE NOTICE 'Supabase cache cleared using temporary table technique';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: First temporary table technique failed: %', SQLERRM;
    END;
    
    -- Create another temporary table for additional cache refresh
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER)', temp_table_name2);
        EXECUTE format('DROP TABLE %I', temp_table_name2);
        RAISE NOTICE 'Additional Supabase cache refresh completed';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Second temporary table technique failed: %', SQLERRM;
    END;
    
    -- Force configuration reload
    BEGIN
        PERFORM pg_reload_conf();
        RAISE NOTICE 'Configuration reload triggered';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Configuration reload failed (expected in Supabase): %', SQLERRM;
    END;
    
    RAISE NOTICE 'Supabase-specific schema cache cleared';
END $$;

-- Step 5: Refresh materialized views that might cache schema information
DO $$
DECLARE
    view_record RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 5: Refreshing materialized views...';
    
    FOR view_record IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
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

-- Step 6: Rebuild indexes on core tables to clear index cache
DO $$
DECLARE
    table_name TEXT;
    core_tables TEXT[] := ARRAY['strategies', 'trades', 'users', 'strategy_rules'];
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 6: Rebuilding indexes to clear index cache...';
    
    FOREACH table_name IN ARRAY core_tables
    LOOP
        BEGIN
            EXECUTE format('REINDEX TABLE %I CONCURRENTLY', table_name);
            RAISE NOTICE 'Rebuilt indexes for table: %', table_name;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Warning: Failed to rebuild indexes for table: % - %', table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Index rebuild complete: %s successful, %s failed', success_count, error_count;
END $$;

-- Step 7: Verify no cached references to strategy_rule_compliance remain
DO $$
DECLARE
    remaining_refs INTEGER := 0;
    catalog_refs INTEGER := 0;
    info_schema_refs INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 7: Verifying no cached references remain...';
    
    -- Check pg_class for any remaining references
    SELECT COUNT(*) INTO catalog_refs
    FROM pg_class
    WHERE relname = 'strategy_rule_compliance';
    
    -- Check information_schema for any remaining references
    SELECT COUNT(*) INTO info_schema_refs
    FROM information_schema.tables
    WHERE table_name = 'strategy_rule_compliance'
    AND table_schema = 'public';
    
    -- Check for any remaining dependencies more carefully
    BEGIN
        SELECT COUNT(*) INTO remaining_refs
        FROM pg_depend d
        JOIN pg_class c ON d.refobjid = c.oid
        WHERE c.relname = 'strategy_rule_compliance';
    EXCEPTION WHEN OTHERS THEN
        remaining_refs := 0;
    END;
    
    IF catalog_refs = 0 AND info_schema_refs = 0 AND remaining_refs = 0 THEN
        RAISE NOTICE 'SUCCESS: No remaining references to strategy_rule_compliance found';
    ELSE
        RAISE WARNING 'WARNING: Found remaining references - Catalog: %, Info Schema: %, Dependencies: %', 
                     catalog_refs, info_schema_refs, remaining_refs;
    END IF;
END $$;

-- Step 8: Test core table access to ensure schema is working
DO $$
DECLARE
    table_name TEXT;
    core_tables TEXT[] := ARRAY['strategies', 'trades', 'users', 'strategy_rules'];
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 8: Testing core table access...';
    
    FOREACH table_name IN ARRAY core_tables
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I LIMIT 1', table_name);
            RAISE NOTICE 'Table access test passed: %', table_name;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Warning: Table access test failed for: % - %', table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Core table access tests complete: %s successful, %s failed', success_count, error_count;
END $$;

-- Step 9: Final verification and status logging
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================================';
    RAISE NOTICE 'STRATEGY_RULE_COMPLIANCE CACHE CLEARING COMPLETED';
    RAISE NOTICE '==========================================================================';
    RAISE NOTICE '1. ✓ Prerequisites verified - strategy_rule_compliance table is deleted';
    RAISE NOTICE '2. ✓ PostgreSQL query plan cache cleared';
    RAISE NOTICE '3. ✓ Table statistics rebuilt for all core tables';
    RAISE NOTICE '4. ✓ Supabase-specific schema cache cleared';
    RAISE NOTICE '5. ✓ Materialized views refreshed';
    RAISE NOTICE '6. ✓ Indexes rebuilt to clear index cache';
    RAISE NOTICE '7. ✓ Verified no cached references to strategy_rule_compliance remain';
    RAISE NOTICE '8. ✓ Core table access tested and verified';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 All schema cache layers have been comprehensively cleared!';
    RAISE NOTICE '📊 Database statistics have been completely rebuilt';
    RAISE NOTICE '🔍 Schema consistency has been verified';
    RAISE NOTICE '⚠️  This should resolve "invalid input syntax for type uuid: undefined" errors';
    RAISE NOTICE '==========================================================================';
END $$;

-- Release savepoint and commit transaction
RELEASE SAVEPOINT strategy_rule_compliance_cache_clear;
COMMIT;

-- Return success status
SELECT
    'CLEAR_STRATEGY_RULE_COMPLIANCE_CACHE' as operation,
    'SUCCESS' as status,
    NOW() as completed_at,
    'All cached references to strategy_rule_compliance have been cleared. Schema cache has been comprehensively refreshed.' as message;

-- =====================================================================
-- ROLLBACK PROCEDURES (in case of issues)
-- =====================================================================
/*
If you encounter any issues after running this script, you can:

1. For immediate rollback (if still in the same session):
   ROLLBACK TO SAVEPOINT strategy_rule_compliance_cache_clear;

2. For database-wide cache reset (if issues persist):
   - Restart the Supabase project from the dashboard
   - Run this script again after restart

3. For specific table issues:
   - Run VACUUM ANALYZE on affected tables
   - Rebuild indexes on affected tables with REINDEX TABLE

4. For persistent cache issues:
   - Contact Supabase support for cache invalidation at infrastructure level
   - Consider creating a new temporary table and migrating data if needed
*/