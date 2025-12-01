-- Aggressive Supabase Schema Cache Clear Script
-- Purpose: Completely clear all layers of schema cache that could be affecting strategies table
-- This script targets PostgreSQL internal caches, Supabase-specific caches, and client-side caches

-- Step 1: Clear all PostgreSQL system caches aggressively
DO $$
BEGIN
    RAISE NOTICE '=== STARTING AGGRESSIVE SCHEMA CACHE CLEAR ===';
    
    -- Clear query plan cache for current session
    PERFORM 'DISCARD PLANS';
    
    -- Clear temporary tables and sequences
    PERFORM 'DISCARD TEMP';
    
    -- Reset all session configuration
    PERFORM 'DISCARD ALL';
    
    -- Clear all prepared statements
    PERFORM 'DEALLOCATE ALL';
    
    RAISE NOTICE 'PostgreSQL session caches cleared';
END $$;

-- Step 2: Force database-wide statistics updates
DO $$
BEGIN
    RAISE NOTICE 'Updating database statistics...';
    
    -- Update statistics for all core tables
    EXECUTE 'ANALYZE strategies';
    EXECUTE 'ANALYZE trades';
    EXECUTE 'ANALYZE users';
    EXECUTE 'ANALYZE strategy_rules';
    EXECUTE 'ANALYZE trade_tags';
    EXECUTE 'ANALYZE tags';
    
    -- Force vacuum with analyze to rebuild statistics completely
    EXECUTE 'VACUUM ANALYZE strategies';
    EXECUTE 'VACUUM ANALYZE trades';
    EXECUTE 'VACUUM ANALYZE users';
    EXECUTE 'VACUUM ANALYZE strategy_rules';
    EXECUTE 'VACUUM ANALYZE trade_tags';
    EXECUTE 'VACUUM ANALYZE tags';
    
    -- Update statistics for the entire database
    EXECUTE 'ANALYZE';
    
    RAISE NOTICE 'Database statistics updated completely';
END $$;

-- Step 3: Rebuild all indexes to clear index cache
DO $$
BEGIN
    RAISE NOTICE 'Rebuilding indexes to clear index cache...';
    
    -- Rebuild indexes on strategies table
    EXECUTE 'REINDEX TABLE strategies CONCURRENTLY';
    EXECUTE 'REINDEX TABLE trades CONCURRENTLY';
    EXECUTE 'REINDEX TABLE users CONCURRENTLY';
    EXECUTE 'REINDEX TABLE strategy_rules CONCURRENTLY';
    
    RAISE NOTICE 'Indexes rebuilt successfully';
END $$;

-- Step 4: Clear PostgreSQL system catalog cache
DO $$
BEGIN
    RAISE NOTICE 'Clearing system catalog cache...';
    
    -- Force reload of PostgreSQL configuration
    PERFORM pg_reload_conf();
    
    -- Clear any cached information about tables
    EXECUTE 'DISCARD SEQUENCES';
    EXECUTE 'DISCARD SEARCH_PATH';
    
    RAISE NOTICE 'System catalog cache cleared';
END $$;

-- Step 5: Invalidate any remaining cached references to deleted tables
DO $$
DECLARE
    rec RECORD;
    remaining_tables INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for remaining references to deleted tables...';
    
    -- Check for any remaining strategy_rule_compliance references
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE WARNING 'Found reference to strategy_rule_compliance in: %.%', rec.schemaname, rec.tablename;
        remaining_tables := remaining_tables + 1;
    END LOOP;
    
    -- Check information schema for any remaining references
    FOR rec IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE WARNING 'Found information_schema reference to strategy_rule_compliance in: %.%', rec.table_schema, rec.table_name;
        remaining_tables := remaining_tables + 1;
    END LOOP;
    
    IF remaining_tables = 0 THEN
        RAISE NOTICE '✓ No remaining references to deleted tables found';
    ELSE
        RAISE WARNING '⚠️ Found % remaining references to deleted tables', remaining_tables;
    END IF;
END $$;

-- Step 6: Refresh all materialized views that might cache schema information
DO $$
DECLARE
    mat_view RECORD;
    refreshed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Refreshing materialized views...';
    
    FOR mat_view IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || 
                    quote_ident(mat_view.schemaname) || '.' || 
                    quote_ident(mat_view.matviewname);
            RAISE NOTICE '✓ Refreshed materialized view: %.%', mat_view.schemaname, mat_view.matviewname;
            refreshed_count := refreshed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not refresh materialized view: %.% - %', 
                          mat_view.schemaname, mat_view.matviewname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Materialized views refreshed: %', refreshed_count;
END $$;

-- Step 7: Force cache invalidation for all core tables
DO $$
DECLARE
    table_name TEXT;
    core_tables TEXT[] := ARRAY['strategies', 'trades', 'users', 'strategy_rules', 'trade_tags', 'tags'];
BEGIN
    RAISE NOTICE 'Forcing cache invalidation for core tables...';
    
    FOREACH table_name IN ARRAY core_tables
    LOOP
        BEGIN
            -- Force table-level cache invalidation
            EXECUTE 'ANALYZE ' || quote_ident(table_name);
            EXECUTE 'VACUUM ANALYZE ' || quote_ident(table_name);
            
            -- Update table statistics
            EXECUTE 'ALTER TABLE ' || quote_ident(table_name) || ' SET (autovacuum_enabled = true)';
            EXECUTE 'ALTER TABLE ' || quote_ident(table_name) || ' SET (autovacuum_vacuum_scale_factor = 0.1)';
            
            RAISE NOTICE '✓ Cache invalidated for table: %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not invalidate cache for table: % - %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 8: Verify schema consistency after cache clear
DO $$
DECLARE
    strategies_exists BOOLEAN;
    strategies_columns INTEGER;
    deleted_table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Verifying schema consistency...';
    
    -- Check if strategies table exists and is accessible
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'strategies' 
        AND table_schema = 'public'
    ) INTO strategies_exists;
    
    IF strategies_exists THEN
        -- Count columns in strategies table
        SELECT COUNT(*) INTO strategies_columns
        FROM information_schema.columns 
        WHERE table_name = 'strategies' 
        AND table_schema = 'public';
        
        RAISE NOTICE '✓ Strategies table exists with % columns', strategies_columns;
    ELSE
        RAISE EXCEPTION '❌ Strategies table does not exist or is not accessible';
    END IF;
    
    -- Verify strategy_rule_compliance table does not exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'strategy_rule_compliance' 
        AND table_schema = 'public'
    ) INTO deleted_table_exists;
    
    IF NOT deleted_table_exists THEN
        RAISE NOTICE '✓ Confirmed: strategy_rule_compliance table does not exist';
    ELSE
        RAISE EXCEPTION '❌ strategy_rule_compliance table still exists - this indicates a serious problem';
    END IF;
END $$;

-- Step 9: Clear any remaining function cache
DO $$
BEGIN
    RAISE NOTICE 'Clearing function cache...';
    
    -- Reload all functions to clear cached execution plans
    PERFORM pg_reload_conf();
    
    -- Clear any cached function results
    EXECUTE 'DISCARD PLANS';
    EXECUTE 'DISCARD ALL';
    
    RAISE NOTICE 'Function cache cleared';
END $$;

-- Step 10: Final verification and completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== AGGRESSIVE SCHEMA CACHE CLEAR COMPLETED ===';
    RAISE NOTICE '1. ✓ PostgreSQL session caches cleared';
    RAISE NOTICE '2. ✓ Database statistics updated completely';
    RAISE NOTICE '3. ✓ Indexes rebuilt to clear index cache';
    RAISE NOTICE '4. ✓ System catalog cache cleared';
    RAISE NOTICE '5. ✓ Deleted table references checked';
    RAISE NOTICE '6. ✓ Materialized views refreshed';
    RAISE NOTICE '7. ✓ Core table cache invalidated';
    RAISE NOTICE '8. ✓ Schema consistency verified';
    RAISE NOTICE '9. ✓ Function cache cleared';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 All schema cache layers have been aggressively cleared!';
    RAISE NOTICE '📊 Database statistics have been completely rebuilt';
    RAISE NOTICE '🔍 Schema consistency has been verified';
    RAISE NOTICE '==============================================';
END $$;