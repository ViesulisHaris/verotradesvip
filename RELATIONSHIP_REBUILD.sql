-- RELATIONSHIP_REBUILD.sql
-- Purpose: Rebuild foreign key relationships and fix missing relationship definitions
-- This script analyzes and rebuilds relationships between strategies and related tables
-- Ensures proper RLS policy evaluation and fixes any missing relationship definitions
--
-- DEPENDENCY: This script should be run AFTER SCHEMA_CACHE_CLEAR.sql has completed successfully
-- EXECUTION ORDER: This should be the SECOND script to run in the sequence

-- ============================================================================
-- WARNING: This script modifies database constraints and relationships
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Start transaction to ensure atomic operations
BEGIN;

-- Create a savepoint for potential rollback
SAVEPOINT relationship_rebuild_start;

-- Step 1: Verify prerequisites before proceeding
DO $$
DECLARE
    cache_clear_completed BOOLEAN;
BEGIN
    RAISE NOTICE 'Step 1: Verifying prerequisites...';
    
    -- Check if any compliance tables still exist (should be deleted by now)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance') AND table_schema = 'public') THEN
        RAISE EXCEPTION 'PREREQUISITE FAILED: Compliance tables still exist. Please run SCHEMA_CACHE_CLEAR.sql first.';
    END IF;
    
    -- Verify strategies table exists (needed for relationship rebuild)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategies' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'PREREQUISITE FAILED: strategies table does not exist. Cannot rebuild relationships.';
    END IF;
    
    RAISE NOTICE 'Prerequisites verified: Compliance tables deleted, strategies table exists';
END $$;

-- Step 2: Create a temporary table to track relationship fixes
CREATE TEMP TABLE IF NOT EXISTS relationship_fix_log (
    step_number INTEGER,
    operation TEXT,
    table_name TEXT,
    constraint_name TEXT,
    status TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Log the start of the relationship rebuild process
INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
VALUES (2, 'START', 'ALL', 'INFO', 'Starting relationship rebuild process');

-- Step 3: Identify all tables that should have relationships with strategies
DO $$
DECLARE
    table_record RECORD;
    relationship_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Analyzing current relationship state...';
    
    -- Check for tables that might need strategy relationships
    FOR table_record IN
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('relationship_fix_log')
        ORDER BY table_name
    LOOP
        BEGIN
            -- Check if this table has a strategy_id column
            IF EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_name = table_record.table_name
                AND c.table_schema = table_record.table_schema
                AND c.column_name = 'strategy_id'
            ) THEN
                relationship_count := relationship_count + 1;
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (3, 'ANALYZE', table_record.table_name, 'FOUND', 'Table has strategy_id column');
                
                RAISE NOTICE 'Found table with strategy_id: %', table_record.table_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (3, 'ANALYZE', table_record.table_name, 'ERROR', format('Failed to analyze: %s', SQLERRM));
        END;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (3, 'ANALYZE', 'SUMMARY', 'INFO', format('Found %s tables with strategy_id columns, %s errors', relationship_count, error_count));
    
    RAISE NOTICE 'Analysis complete: % tables with strategy_id columns found, %s errors', relationship_count, error_count;
END $$;

-- Step 4: Fix strategies table relationships
DO $$
DECLARE
    constraint_exists BOOLEAN;
    table_name TEXT := 'strategies';
    pk_column_name TEXT;
BEGIN
    RAISE NOTICE 'Checking strategies table relationships...';
    
    -- Ensure strategies table exists and is properly structured
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'strategies' AND t.table_schema = 'public') THEN
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (4, 'CHECK', table_name, 'ERROR', 'Strategies table does not exist');
        RAISE EXCEPTION 'Strategies table does not exist';
    END IF;
    
    -- Check for proper primary key and get its name
    SELECT column_name INTO pk_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'strategies'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
    
    IF pk_column_name IS NULL THEN
        -- Add primary key if missing
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD COLUMN id SERIAL PRIMARY KEY', table_name);
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (4, 'FIX', table_name, 'SUCCESS', 'Added primary key column');
            RAISE NOTICE 'Added primary key to strategies table';
            pk_column_name := 'id';
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (4, 'FIX', table_name, 'ERROR', format('Failed to add primary key: %s', SQLERRM));
            RAISE EXCEPTION 'Failed to add primary key to strategies table: %', SQLERRM;
        END;
    ELSE
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (4, 'CHECK', table_name, 'OK', format('Primary key exists: %s', pk_column_name));
    END IF;
    
    -- Ensure user_id column exists for RLS
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = 'strategies'
        AND c.column_name = 'user_id'
        AND c.table_schema = 'public'
    ) THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id)', table_name);
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (4, 'FIX', table_name, 'SUCCESS', 'Added user_id column with foreign key');
            RAISE NOTICE 'Added user_id column to strategies table';
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (4, 'FIX', table_name, 'ERROR', format('Failed to add user_id: %s', SQLERRM));
            RAISE NOTICE 'Warning: Failed to add user_id to strategies table: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 5: Rebuild foreign key relationships for all tables with strategy_id
DO $$
DECLARE
    table_record RECORD;
    v_constraint_name TEXT;
    constraint_exists BOOLEAN;
    pk_column_name TEXT;
    error_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Rebuilding foreign key relationships...';
    
    -- Get the primary key column name for strategies table
    SELECT column_name INTO pk_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'strategies'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
    
    IF pk_column_name IS NULL THEN
        RAISE EXCEPTION 'Cannot determine primary key column for strategies table';
    END IF;
    
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = tables.table_name
            AND c.table_schema = tables.table_schema
            AND c.column_name = 'strategy_id'
        )
    LOOP
        v_constraint_name := format('%s_strategy_id_fkey', table_record.table_name);
        
        BEGIN
            -- Check if foreign key already exists
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                WHERE tc.table_name = table_record.table_name
                AND tc.constraint_name = v_constraint_name
                AND tc.constraint_type = 'FOREIGN KEY'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Add the foreign key constraint
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (strategy_id) REFERENCES strategies(%I) ON DELETE CASCADE',
                              table_record.table_name, v_constraint_name, pk_column_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'ADD_FK', table_record.table_name, 'SUCCESS', format('Added foreign key: %s', v_constraint_name));
                
                RAISE NOTICE 'Added foreign key constraint for table: %', table_record.table_name;
                success_count := success_count + 1;
            ELSE
                -- Verify the existing constraint is valid
                EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', table_record.table_name, v_constraint_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'VALIDATE_FK', table_record.table_name, 'OK', 'Foreign key constraint is valid');
                success_count := success_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                -- Try to drop and recreate invalid constraint
                EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', table_record.table_name, v_constraint_name);
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (strategy_id) REFERENCES strategies(%I) ON DELETE CASCADE',
                              table_record.table_name, v_constraint_name, pk_column_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'REBUILD_FK', table_record.table_name, 'SUCCESS', 'Rebuilt invalid foreign key constraint');
                
                RAISE NOTICE 'Rebuilt foreign key constraint for table: %', table_record.table_name;
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'ADD_FK', table_record.table_name, 'ERROR', format('Failed to add FK: %s', SQLERRM));
                
                RAISE NOTICE 'Failed to add foreign key for table %: %', table_record.table_name, SQLERRM;
            END;
        END;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (5, 'SUMMARY', 'ALL', 'INFO', format('Foreign key rebuild: %s successful, %s errors', success_count, error_count));
END $$;

-- Step 6: Ensure proper indexes for foreign key relationships
DO $$
DECLARE
    table_record RECORD;
    index_name TEXT;
    index_exists BOOLEAN;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Creating indexes for foreign key relationships...';
    
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = tables.table_name
            AND c.table_schema = tables.table_schema
            AND c.column_name = 'strategy_id'
        )
    LOOP
        index_name := format('%s_strategy_id_idx', table_record.table_name);
        
        BEGIN
            -- Check if index already exists
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE tablename = table_record.table_name
                AND indexname = index_name
                AND schemaname = 'public'
            ) INTO index_exists;
            
            IF NOT index_exists THEN
                -- Create the index
                EXECUTE format('CREATE INDEX %I ON %I (strategy_id)', index_name, table_record.table_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (6, 'CREATE_INDEX', table_record.table_name, 'SUCCESS', format('Created index: %s', index_name));
                
                RAISE NOTICE 'Created index for table: %', table_record.table_name;
                success_count := success_count + 1;
            ELSE
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (6, 'CHECK_INDEX', table_record.table_name, 'OK', 'Index already exists');
                success_count := success_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (6, 'CREATE_INDEX', table_record.table_name, 'ERROR', format('Failed to create index: %s', SQLERRM));
            
            RAISE NOTICE 'Failed to create index for table %: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (6, 'SUMMARY', 'ALL', 'INFO', format('Index creation: %s successful, %s errors', success_count, error_count));
END $$;

-- Step 7: Ensure RLS policies are properly configured for strategy relationships
DO $$
DECLARE
    table_record RECORD;
    policy_exists BOOLEAN;
    rls_enabled_count INTEGER := 0;
    policy_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking RLS policies for strategy relationships...';
    
    -- Ensure RLS is enabled on strategies table
    BEGIN
        ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (7, 'ENABLE_RLS', 'strategies', 'SUCCESS', 'Enabled RLS on strategies table');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (7, 'ENABLE_RLS', 'strategies', 'ERROR', format('Failed to enable RLS: %s', SQLERRM));
        error_count := error_count + 1;
    END;
    
    -- Check if RLS is enabled on all tables with strategy_id
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = tables.table_name
            AND c.table_schema = tables.table_schema
            AND c.column_name = 'strategy_id'
        )
    LOOP
        BEGIN
            -- Enable RLS if not already enabled
            IF NOT EXISTS (
                SELECT 1 FROM pg_tables
                WHERE tablename = table_record.table_name
                AND rowsecurity = true
            ) THEN
                EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (7, 'ENABLE_RLS', table_record.table_name, 'SUCCESS', 'Enabled RLS');
                
                RAISE NOTICE 'Enabled RLS on table: %', table_record.table_name;
                rls_enabled_count := rls_enabled_count + 1;
            END IF;
            
            -- Create a basic RLS policy if none exists
            SELECT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE tablename = table_record.table_name
            ) INTO policy_exists;
            
            IF NOT policy_exists THEN
                BEGIN
                    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (auth.uid() = user_id)',
                                  format('%s_user_policy', table_record.table_name), table_record.table_name);
                    
                    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                    VALUES (7, 'CREATE_POLICY', table_record.table_name, 'SUCCESS', 'Created basic RLS policy');
                    
                    RAISE NOTICE 'Created RLS policy for table: %', table_record.table_name;
                    policy_count := policy_count + 1;
                EXCEPTION WHEN OTHERS THEN
                    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                    VALUES (7, 'CREATE_POLICY', table_record.table_name, 'ERROR', format('Failed to create policy: %s', SQLERRM));
                    error_count := error_count + 1;
                END;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (7, 'RLS_ERROR', table_record.table_name, 'ERROR', format('RLS setup failed: %s', SQLERRM));
        END;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (7, 'SUMMARY', 'ALL', 'INFO', format('RLS setup: %s tables enabled, %s policies created, %s errors', rls_enabled_count, policy_count, error_count));
END $$;

-- Step 8: Verify all relationships are properly established
DO $$
DECLARE
    relationship_count INTEGER := 0;
    invalid_count INTEGER := 0;
    table_record RECORD;
BEGIN
    RAISE NOTICE 'Verifying relationship integrity...';
    
    -- Count valid relationships
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'strategies'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = tables.table_name
            AND c.table_schema = tables.table_schema
            AND c.column_name = 'strategy_id'
        )
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            WHERE tc.table_name = table_record.table_name
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        ) THEN
            relationship_count := relationship_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (8, 'VERIFY', table_record.table_name, 'SUCCESS', 'Foreign key constraint verified');
        ELSE
            invalid_count := invalid_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (8, 'VERIFY', table_record.table_name, 'ERROR', 'Missing foreign key constraint');
        END IF;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (8, 'SUMMARY', 'ALL', 'INFO', format('Found %s valid relationships, %s invalid', relationship_count, invalid_count));
    
    RAISE NOTICE 'Relationship verification complete: % valid, % invalid', relationship_count, invalid_count;
END $$;

-- Step 9: Final summary report
SELECT
    step_number,
    operation,
    table_name,
    status,
    message,
    created_at
FROM relationship_fix_log
ORDER BY step_number, created_at;

-- Release savepoint and commit transaction
RELEASE SAVEPOINT relationship_rebuild_start;
COMMIT;

-- Get error count before dropping the table
DO $$
DECLARE
    error_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO error_count FROM relationship_fix_log WHERE status = 'ERROR';
    
    -- Return success status
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================================';
    RAISE NOTICE 'RELATIONSHIP REBUILD SUMMARY';
    RAISE NOTICE 'Operation: RELATIONSHIP_REBUILD';
    IF error_count = 0 THEN
        RAISE NOTICE 'Status: SUCCESS';
        RAISE NOTICE 'Message: All relationships rebuilt and verified. Ready for VERIFICATION.sql';
    ELSE
        RAISE NOTICE 'Status: PARTIAL_SUCCESS';
        RAISE NOTICE 'Message: Relationship rebuild completed with %s errors. See log for details. Ready for VERIFICATION.sql', error_count;
    END IF;
    RAISE NOTICE 'Completed at: %', NOW();
    
    -- Final completion notice
    RAISE NOTICE 'RELATIONSHIP REBUILD COMPLETED';
    IF error_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All foreign key relationships have been rebuilt';
        RAISE NOTICE 'Indexes created for performance optimization';
        RAISE NOTICE 'RLS policies configured for security';
        RAISE NOTICE 'Ready for next step: VERIFICATION.sql';
    ELSE
        RAISE NOTICE 'PARTIAL SUCCESS: Relationship rebuild completed with %s errors', error_count;
        RAISE NOTICE 'See detailed log above for specific issues';
        RAISE NOTICE 'Proceeding to VERIFICATION.sql for comprehensive check';
    END IF;
    RAISE NOTICE '==========================================================================';
END $$;

-- Return success status as a query result
SELECT
    'RELATIONSHIP_REBUILD' as operation,
    CASE
        WHEN (SELECT COUNT(*) FROM relationship_fix_log WHERE status = 'ERROR') = 0 THEN 'SUCCESS'
        ELSE 'PARTIAL_SUCCESS'
    END as status,
    NOW() as completed_at,
    CASE
        WHEN (SELECT COUNT(*) FROM relationship_fix_log WHERE status = 'ERROR') = 0 THEN
            'All relationships rebuilt and verified. Ready for VERIFICATION.sql'
        ELSE
            format('Relationship rebuild completed with %s errors. See log for details. Ready for VERIFICATION.sql',
                   (SELECT COUNT(*) FROM relationship_fix_log WHERE status = 'ERROR'))
    END as message;

-- Clean up temporary table
DROP TABLE IF EXISTS relationship_fix_log;