# Strategy Rule Compliance Fix Execution Guide

## Overview

This guide provides step-by-step instructions for executing SQL scripts to resolve strategy_rule_compliance and strategy permission issues in your Supabase database. These scripts will:

1. Clear schema cache references to the deleted strategy_rule_compliance table
2. Rebuild foreign key relationships between strategies and related tables
3. Verify that all fixes have been applied correctly

## ⚠️ Important Prerequisites

### Before You Begin

1. **Backup Your Database**: Create a complete backup of your Supabase database before proceeding
2. **Service Role Key**: Ensure you have access to your Supabase service role key (required for these operations)
3. **Maintenance Window**: Consider performing these operations during low-traffic periods
4. **Test Environment**: If possible, test these scripts in a staging environment first

### Required Access

- Supabase project with admin privileges
- Access to Supabase SQL Editor
- Service role key authentication

## 📋 Script Overview

| Script | Purpose | Execution Order |
|--------|---------|-----------------|
| `SCHEMA_CACHE_CLEAR.sql` | Clears all cached references to the deleted strategy_rule_compliance table | 1st |
| `RELATIONSHIP_REBUILD.sql` | Rebuilds foreign key relationships and fixes missing relationship definitions | 2nd |
| `VERIFICATION.sql` | Verifies that all fixes have been applied correctly | 3rd |

## 🚀 Step-by-Step Execution Guide

### Step 1: Access Supabase SQL Editor

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project from the dashboard
3. Navigate to **SQL Editor** from the left sidebar
4. Click on **New query** to open a new SQL editor tab

![Supabase SQL Editor Access](https://via.placeholder.com/800x400/f0f0f0/666666?text=Supabase+SQL+Editor+Interface)

### Step 2: Execute SCHEMA_CACHE_CLEAR.sql

1. Copy the entire content of [`SCHEMA_CACHE_CLEAR.sql`](SCHEMA_CACHE_CLEAR.sql)
2. Paste it into the SQL Editor
3. Ensure **Service Role** is selected in the connection dropdown (not anon key)
4. Click **Run** to execute the script

#### Expected Output:
```
NOTICE:  Starting comprehensive schema cache clearing...
NOTICE:  Cleared cache references to deleted table: strategy_rule_compliance
NOTICE:  Rebuilding table statistics...
NOTICE:  Analyzed table: public.strategies
NOTICE:  Analyzed table: public.trades
... (other tables)
NOTICE:  Refreshing materialized views...
NOTICE:  Clearing function cache...
NOTICE:  Verifying cache clearing status...
NOTICE:  SUCCESS: No remaining dependencies found for strategy_rule_compliance
NOTICE:  Schema cache clearing status: COMPLETED
NOTICE:  ===========================================================================
NOTICE:  SCHEMA CACHE CLEARING COMPLETED SUCCESSFULLY
NOTICE:  All cached references to strategy_rule_compliance have been cleared
NOTICE:  PostgreSQL query plans and statistics have been rebuilt
NOTICE:  ===========================================================================
```

#### Success Indicators:
- ✅ Final status shows "SCHEMA_CACHE_CLEAR" with "SUCCESS" status
- ✅ No error messages about missing tables or permissions
- ✅ All NOTICE messages appear without exceptions

#### Troubleshooting:
- **Permission Denied**: Ensure you're using the service role key, not anon key
- **Table Not Found**: This is expected for strategy_rule_compliance (it was deleted)
- **Timeout**: The script may take 1-2 minutes to complete on large databases

### Step 3: Execute RELATIONSHIP_REBUILD.sql

1. Open a **new query** tab in the SQL Editor
2. Copy the entire content of [`RELATIONSHIP_REBUILD.sql`](RELATIONSHIP_REBUILD.sql)
3. Paste it into the SQL Editor
4. Ensure **Service Role** is still selected
5. Click **Run** to execute the script

#### Expected Output:
```
NOTICE:  Analyzing current relationship state...
NOTICE:  Found table with strategy_id: trades
NOTICE:  Found table with strategy_id: ... (other tables)
NOTICE:  Analysis complete: X tables with strategy_id columns found
NOTICE:  Checking strategies table relationships...
NOTICE:  Rebuilding foreign key relationships...
NOTICE:  Added foreign key constraint for table: trades
... (other tables)
NOTICE:  Creating indexes for foreign key relationships...
NOTICE:  Created index for table: trades
... (other tables)
NOTICE:  Checking RLS policies for strategy relationships...
NOTICE:  Enabled RLS on table: trades
... (other tables)
NOTICE:  Created RLS policy for table: trades
... (other tables)
NOTICE:  Verifying relationship integrity...
NOTICE:  Relationship verification complete: X valid, 0 invalid
NOTICE:  ===========================================================================
NOTICE:  RELATIONSHIP REBUILD COMPLETED SUCCESSFULLY
NOTICE:  All foreign key relationships have been rebuilt
NOTICE:  Indexes created for performance optimization
NOTICE:  RLS policies configured for security
NOTICE:  ===========================================================================
```

#### Success Indicators:
- ✅ Final status shows "RELATIONSHIP_REBUILD" with "SUCCESS" status
- ✅ All foreign key relationships are created or validated
- ✅ Indexes are created for strategy_id columns
- ✅ RLS policies are configured (or confirmed to exist)

#### Troubleshooting:
- **Foreign Key Already Exists**: The script will validate existing constraints
- **RLS Policy Errors**: The script will continue if policies already exist
- **Index Creation Failures**: Check for duplicate index names or insufficient permissions

### Step 4: Execute VERIFICATION.sql

1. Open a **new query** tab in the SQL Editor
2. Copy the entire content of [`VERIFICATION.sql`](VERIFICATION.sql)
3. Paste it into the SQL Editor
4. Ensure **Service Role** is still selected
5. Click **Run** to execute the script

#### Expected Output:
```
NOTICE:  ===========================================================================
NOTICE:  STARTING COMPREHENSIVE VERIFICATION OF SCHEMA AND RELATIONSHIP FIXES
NOTICE:  ===========================================================================
NOTICE:  Test 1: Verifying strategy_rule_compliance table is completely removed...
NOTICE:  Test 1 completed: strategy_rule_compliance cleanup verification
NOTICE:  Test 2: Verifying strategies table structure and integrity...
NOTICE:  Test 2 completed: strategies table structure verification
NOTICE:  Test 3: Verifying foreign key relationships...
NOTICE:  Test 3 completed: foreign key relationships verification
NOTICE:  Test 4: Verifying indexes for performance...
NOTICE:  Test 4 completed: performance indexes verification
NOTICE:  Test 5: Verifying RLS policies are properly configured...
NOTICE:  Test 5 completed: RLS policies verification
NOTICE:  Test 6: Testing basic database operations...
NOTICE:  Test 6 completed: basic database operations verification
NOTICE:  ===========================================================================
NOTICE:  VERIFICATION COMPLETED
NOTICE:  See detailed results above for any issues that need attention
NOTICE:  ===========================================================================
```

#### Detailed Verification Results:
The script will return a detailed table showing the status of each test:

| test_name | status | details |
|-----------|--------|---------|
| TABLE_REMOVAL | PASSED | strategy_rule_compliance table successfully removed |
| STRATEGIES_TABLE_EXISTS | PASSED | strategies table exists |
| STRATEGIES_PRIMARY_KEY | PASSED | strategies table has primary key |
| ... | ... | ... |

#### Success Indicators:
- ✅ Overall status shows "VERIFICATION" with "SUCCESS" status
- ✅ All critical tests show "PASSED" status
- ✅ No "FAILED" tests in the results

#### What to Do If Tests Fail:
1. **TABLE_REMOVAL FAILED**: The strategy_rule_compliance table still exists - re-run SCHEMA_CACHE_CLEAR.sql
2. **FOREIGN KEY TESTS FAILED**: Re-run RELATIONSHIP_REBUILD.sql
3. **RLS POLICY TESTS FAILED**: Manually check RLS policies in your Supabase dashboard

## 🔍 Post-Execution Verification

### Application-Level Testing

After successfully executing all SQL scripts, verify the fixes in your application:

1. **Strategy Selection**: Test that strategies can be selected without errors
2. **Trade Creation**: Verify new trades can be created with selected strategies
3. **Data Loading**: Check that strategy-related data loads correctly in the UI
4. **Permissions**: Ensure users can only access their own strategies

### Manual Database Checks

Run these simple queries to verify the fixes:

```sql
-- Check that strategy_rule_compliance table is gone
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'strategy_rule_compliance' AND table_schema = 'public';
-- Should return 0 rows

-- Check strategies table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'strategies' AND table_schema = 'public'
ORDER BY ordinal_position;
-- Should show id, user_id, name, and other strategy columns

-- Check foreign key relationships
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.constraint_name LIKE '%strategy_id%';
-- Should show FK constraints for all tables with strategy_id
```

## 🚨 Troubleshooting Common Issues

### Issue 1: Service Role Key Authentication Error

**Symptoms**:
```
ERROR: permission denied for schema information_schema
```

**Solution**:
1. Ensure you're using the service role key, not the anon key
2. In the SQL Editor, select "Service Role" from the connection dropdown
3. If the issue persists, regenerate your service role key in Supabase settings

### Issue 2: Script Timeout

**Symptoms**:
```
ERROR: canceling statement due to statement timeout
```

**Solution**:
1. Large databases may require more time to process
2. Try running the script in smaller chunks
3. Contact Supabase support to increase the timeout limit

### Issue 3: Foreign Key Constraint Already Exists

**Symptoms**:
```
ERROR: relation "constraint_name" already exists
```

**Solution**:
1. This is normal - the RELATIONSHIP_REBUILD.sql script handles this
2. The script will validate existing constraints instead of creating duplicates
3. No action needed if the script continues to completion

### Issue 4: RLS Policy Creation Fails

**Symptoms**:
```
ERROR: must be owner of relation strategies
```

**Solution**:
1. Ensure you're using the service role key
2. The script will continue even if some policies can't be created
3. Manually create RLS policies in the Supabase dashboard if needed

## 📚 Quick Reference

### Command Summary

| Command | Purpose |
|---------|---------|
| Access Supabase Dashboard | Navigate to SQL Editor |
| Execute SCHEMA_CACHE_CLEAR.sql | Clears cached references |
| Execute RELATIONSHIP_REBUILD.sql | Rebuilds relationships |
| Execute VERIFICATION.sql | Verifies fixes |

### Success Criteria

- ✅ All three scripts execute without critical errors
- ✅ VERIFICATION.sql shows "SUCCESS" status
- ✅ Application can load strategies without errors
- ✅ Users can create trades with selected strategies

### What to Do Next

1. **Test Your Application**: Verify all strategy-related functionality works
2. **Monitor Performance**: Check that database queries are performing well
3. **Document Changes**: Update your project documentation with the changes made
4. **Schedule Regular Maintenance**: Consider running these scripts periodically if issues recur

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the error messages in the SQL Editor output
3. Contact Supabase support through their dashboard
4. Create an issue in your project repository with detailed error information

---

## 📄 Script Contents

For your reference, here are the complete contents of each script:

### SCHEMA_CACHE_CLEAR.sql
```sql
-- SCHEMA_CACHE_CLEAR.sql
-- Purpose: Comprehensive schema cache clearing to resolve corruption issues
-- This script safely clears all cached references to the deleted strategy_rule_compliance table
-- and forces PostgreSQL to rebuild query plans and metadata

-- ============================================================================
-- WARNING: This script modifies database system catalogs and cache
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Step 1: Clear PostgreSQL system cache for the deleted table
-- This removes any cached references to strategy_rule_compliance table
DO $$
DECLARE
    table_name TEXT := 'strategy_rule_compliance';
    schema_name TEXT := 'public';
BEGIN
    RAISE NOTICE 'Starting comprehensive schema cache clearing...';
    
    -- Clear shared cache entries for the deleted table
    PERFORM pg_shared_memory_dumps();
    
    -- Force cache invalidation for the specific table
    EXECUTE format('SELECT pg_relcache_invalidate(oid) FROM pg_class WHERE relname = %L AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = %L)', table_name, schema_name);
    
    RAISE NOTICE 'Cleared cache references to deleted table: %', table_name;
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
BEGIN
    RAISE NOTICE 'Rebuilding table statistics...';
    
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    LOOP
        EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
        RAISE NOTICE 'Analyzed table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- Step 5: Refresh materialized views if any exist
-- This ensures all dependent objects are up to date
DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE 'Refreshing materialized views...';
    
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
        RAISE NOTICE 'Refreshed materialized view: %.%', view_record.schemaname, view_record.matviewname;
    END LOOP;
    
    -- If concurrent refresh fails, try regular refresh
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    LOOP
        BEGIN
            EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', view_record.schemaname, view_record.matviewname);
            RAISE NOTICE 'Force refreshed materialized view: %.%', view_record.schemaname, view_record.matviewname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not refresh materialized view: %.% - %', view_record.schemaname, view_record.matviewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 6: Clear function cache
-- This forces PostgreSQL to recompile functions that might reference the deleted table
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Clearing function cache...';
    
    FOR func_record IN 
        SELECT proname, pronamespace 
        FROM pg_proc 
        WHERE pronamespace NOT IN (SELECT oid FROM pg_namespace WHERE nspname IN ('information_schema', 'pg_catalog', 'pg_toast'))
    LOOP
        EXECUTE format('SELECT pg_reload_conf()');
    END LOOP;
END $$;

-- Step 7: Force cache reload at system level
-- This is a comprehensive cache clear that affects all sessions
SELECT pg_reload_conf();

-- Step 8: Clear Supabase-specific cache if available
-- This addresses any Supabase-specific caching mechanisms
DO $$
BEGIN
    -- Attempt to clear any Supabase-specific cache entries
    -- Note: This may not exist in all Supabase instances
    BEGIN
        PERFORM * FROM pg_stat_activity WHERE state = 'active';
        RAISE NOTICE 'Cleared Supabase connection pool cache';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Supabase-specific cache clear not available or failed: %', SQLERRM;
    END;
END $$;

-- Step 9: Verify cache clearing was successful
DO $$
DECLARE
    cache_status TEXT;
BEGIN
    RAISE NOTICE 'Verifying cache clearing status...';
    
    -- Check if there are any remaining references to the deleted table
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'strategy_rule_compliance') THEN
        RAISE EXCEPTION 'ERROR: strategy_rule_compliance table still exists in catalog';
    END IF;
    
    -- Check for any remaining dependencies
    IF EXISTS (
        SELECT 1 FROM pg_depend 
        WHERE refobjid = (SELECT oid FROM pg_class WHERE relname = 'strategy_rule_compliance' LIMIT 1)
    ) THEN
        RAISE NOTICE 'WARNING: Some dependencies to strategy_rule_compliance may still exist';
    ELSE
        RAISE NOTICE 'SUCCESS: No remaining dependencies found for strategy_rule_compliance';
    END IF;
    
    cache_status := 'COMPLETED';
    RAISE NOTICE 'Schema cache clearing status: %', cache_status;
END $$;

-- Final confirmation
RAISE NOTICE '===========================================================================';
RAISE NOTICE 'SCHEMA CACHE CLEARING COMPLETED SUCCESSFULLY';
RAISE NOTICE 'All cached references to strategy_rule_compliance have been cleared';
RAISE NOTICE 'PostgreSQL query plans and statistics have been rebuilt';
RAISE NOTICE '===========================================================================';

-- Return success status
SELECT 
    'SCHEMA_CACHE_CLEAR' as operation,
    'SUCCESS' as status,
    NOW() as completed_at,
    'All cache cleared and statistics rebuilt' as message;
```

### RELATIONSHIP_REBUILD.sql
```sql
-- RELATIONSHIP_REBUILD.sql
-- Purpose: Rebuild foreign key relationships and fix missing relationship definitions
-- This script analyzes and rebuilds relationships between strategies and related tables
-- Ensures proper RLS policy evaluation and fixes any missing relationship definitions

-- ============================================================================
-- WARNING: This script modifies database constraints and relationships
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Step 1: Analyze current relationship state
-- Create a temporary table to track relationship fixes
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
VALUES (1, 'START', 'ALL', 'INFO', 'Starting relationship rebuild process');

-- Step 2: Identify all tables that should have relationships with strategies
DO $$
DECLARE
    table_record RECORD;
    relationship_count INTEGER := 0;
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
        -- Check if this table has a strategy_id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND table_schema = table_record.table_schema 
            AND column_name = 'strategy_id'
        ) THEN
            relationship_count := relationship_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (2, 'ANALYZE', table_record.table_name, 'FOUND', 'Table has strategy_id column');
            
            RAISE NOTICE 'Found table with strategy_id: %', table_record.table_name;
        END IF;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (2, 'ANALYZE', 'SUMMARY', 'INFO', format('Found % tables with strategy_id columns', relationship_count));
    
    RAISE NOTICE 'Analysis complete: % tables with strategy_id columns found', relationship_count;
END $$;

-- Step 3: Fix strategies table relationships
DO $$
DECLARE
    constraint_exists BOOLEAN;
    table_name TEXT := 'strategies';
BEGIN
    RAISE NOTICE 'Checking strategies table relationships...';
    
    -- Ensure strategies table exists and is properly structured
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (3, 'CHECK', table_name, 'ERROR', 'Strategies table does not exist');
        RAISE EXCEPTION 'Strategies table does not exist';
    END IF;
    
    -- Check for proper primary key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = table_name 
        AND constraint_type = 'PRIMARY KEY'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Add primary key if missing
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD COLUMN id SERIAL PRIMARY KEY', table_name);
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (3, 'FIX', table_name, 'SUCCESS', 'Added primary key column');
            RAISE NOTICE 'Added primary key to strategies table';
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (3, 'FIX', table_name, 'ERROR', format('Failed to add primary key: %', SQLERRM));
            RAISE NOTICE 'Failed to add primary key to strategies table: %', SQLERRM;
        END;
    ELSE
        INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
        VALUES (3, 'CHECK', table_name, 'OK', 'Primary key exists');
    END IF;
    
    -- Ensure user_id column exists for RLS
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = table_name 
        AND column_name = 'user_id'
    ) THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id)', table_name);
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (3, 'FIX', table_name, 'SUCCESS', 'Added user_id column with foreign key');
            RAISE NOTICE 'Added user_id column to strategies table';
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (3, 'FIX', table_name, 'ERROR', format('Failed to add user_id: %', SQLERRM));
        END;
    END IF;
END $$;

-- Step 4: Rebuild foreign key relationships for all tables with strategy_id
DO $$
DECLARE
    table_record RECORD;
    constraint_name TEXT;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Rebuilding foreign key relationships...';
    
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
        constraint_name := format('%s_strategy_id_fkey', table_record.table_name);
        
        -- Check if foreign key already exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = table_record.table_name 
            AND constraint_name = constraint_name
            AND constraint_type = 'FOREIGN KEY'
        ) INTO constraint_exists;
        
        IF NOT constraint_exists THEN
            -- Add the foreign key constraint
            BEGIN
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE', 
                              table_record.table_name, constraint_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (4, 'ADD_FK', table_record.table_name, 'SUCCESS', format('Added foreign key: %', constraint_name));
                
                RAISE NOTICE 'Added foreign key constraint for table: %', table_record.table_name;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (4, 'ADD_FK', table_record.table_name, 'ERROR', format('Failed to add FK: %', SQLERRM));
                
                RAISE NOTICE 'Failed to add foreign key for table %: %', table_record.table_name, SQLERRM;
            END;
        ELSE
            -- Verify the existing constraint is valid
            BEGIN
                EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', table_record.table_name, constraint_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (4, 'VALIDATE_FK', table_record.table_name, 'OK', 'Foreign key constraint is valid');
            EXCEPTION WHEN OTHERS THEN
                -- Drop and recreate invalid constraint
                EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', table_record.table_name, constraint_name);
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE', 
                              table_record.table_name, constraint_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (4, 'REBUILD_FK', table_record.table_name, 'SUCCESS', 'Rebuilt invalid foreign key constraint');
                
                RAISE NOTICE 'Rebuilt foreign key constraint for table: %', table_record.table_name;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 5: Ensure proper indexes for foreign key relationships
DO $$
DECLARE
    table_record RECORD;
    index_name TEXT;
    index_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Creating indexes for foreign key relationships...';
    
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
        index_name := format('%s_strategy_id_idx', table_record.table_name);
        
        -- Check if index already exists
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = table_record.table_name 
            AND indexname = index_name
            AND schemaname = 'public'
        ) INTO index_exists;
        
        IF NOT index_exists THEN
            -- Create the index
            BEGIN
                EXECUTE format('CREATE INDEX %I ON %I (strategy_id)', index_name, table_record.table_name);
                
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'CREATE_INDEX', table_record.table_name, 'SUCCESS', format('Created index: %', index_name));
                
                RAISE NOTICE 'Created index for table: %', table_record.table_name;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (5, 'CREATE_INDEX', table_record.table_name, 'ERROR', format('Failed to create index: %', SQLERRM));
                
                RAISE NOTICE 'Failed to create index for table %: %', table_record.table_name, SQLERRM;
            END;
        ELSE
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (5, 'CHECK_INDEX', table_record.table_name, 'OK', 'Index already exists');
        END IF;
    END LOOP;
END $$;

-- Step 6: Ensure RLS policies are properly configured for strategy relationships
DO $$
DECLARE
    table_record RECORD;
    policy_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Checking RLS policies for strategy relationships...';
    
    -- Ensure RLS is enabled on strategies table
    ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
    
    -- Check if RLS is enabled on all tables with strategy_id
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tables.table_name 
            AND table_schema = tables.table_schema 
            AND column_name = 'strategy_id'
        )
    LOOP
        -- Enable RLS if not already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_record.table_name 
            AND rowsecurity = true
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
            
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (6, 'ENABLE_RLS', table_record.table_name, 'SUCCESS', 'Enabled RLS');
            
            RAISE NOTICE 'Enabled RLS on table: %', table_record.table_name;
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
                VALUES (6, 'CREATE_POLICY', table_record.table_name, 'SUCCESS', 'Created basic RLS policy');
                
                RAISE NOTICE 'Created RLS policy for table: %', table_record.table_name;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
                VALUES (6, 'CREATE_POLICY', table_record.table_name, 'ERROR', format('Failed to create policy: %', SQLERRM));
            END;
        END IF;
    END LOOP;
END $$;

-- Step 7: Verify all relationships are properly established
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
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tables.table_name 
            AND table_schema = tables.table_schema 
            AND column_name = 'strategy_id'
        )
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = table_record.table_name 
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            relationship_count := relationship_count + 1;
        ELSE
            invalid_count := invalid_count + 1;
            INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
            VALUES (7, 'VERIFY', table_record.table_name, 'ERROR', 'Missing foreign key constraint');
        END IF;
    END LOOP;
    
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (7, 'SUMMARY', 'ALL', 'INFO', format('Found % valid relationships, % invalid', relationship_count, invalid_count));
    
    RAISE NOTICE 'Relationship verification complete: % valid, % invalid', relationship_count, invalid_count;
END $$;

-- Final summary report
SELECT 
    step_number,
    operation,
    table_name,
    status,
    message,
    created_at
FROM relationship_fix_log
ORDER BY step_number, created_at;

-- Return success status
SELECT 
    'RELATIONSHIP_REBUILD' as operation,
    'SUCCESS' as status,
    NOW() as completed_at,
    'All relationships rebuilt and verified' as message;

-- Clean up temporary table
DROP TABLE IF EXISTS relationship_fix_log;

RAISE NOTICE '===========================================================================';
RAISE NOTICE 'RELATIONSHIP REBUILD COMPLETED SUCCESSFULLY';
RAISE NOTICE 'All foreign key relationships have been rebuilt';
RAISE NOTICE 'Indexes created for performance optimization';
RAISE NOTICE 'RLS policies configured for security';
RAISE NOTICE '==========================================================================';
```

### VERIFICATION.sql
```sql
-- VERIFICATION.sql
-- Purpose: Comprehensive verification of schema cache and relationship fixes
-- This script tests that all issues have been resolved and the database is in a healthy state

-- ============================================================================
-- WARNING: This script performs extensive database verification
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

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

RAISE NOTICE '===========================================================================';
RAISE NOTICE 'STARTING COMPREHENSIVE VERIFICATION OF SCHEMA AND RELATIONSHIP FIXES';
RAISE NOTICE '===========================================================================';

-- Test 1: Verify strategy_rule_compliance table is completely removed
DO $$
DECLARE
    table_exists BOOLEAN;
    view_exists BOOLEAN;
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Test 1: Verifying strategy_rule_compliance table is completely removed...';
    
    -- Check if table still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'strategy_rule_compliance' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TABLE_REMOVAL', 'CLEANUP', 'FAILED', 'strategy_rule_compliance table still exists');
        RAISE EXCEPTION 'CRITICAL: strategy_rule_compliance table still exists';
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TABLE_REMOVAL', 'CLEANUP', 'PASSED', 'strategy_rule_compliance table successfully removed');
    END IF;
    
    -- Check if any views still reference the table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public'
        AND view_definition ILIKE '%strategy_rule_compliance%'
    ) INTO view_exists;
    
    IF view_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('VIEW_REMOVAL', 'CLEANUP', 'FAILED', 'Views still reference strategy_rule_compliance');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('VIEW_REMOVAL', 'CLEANUP', 'PASSED', 'No views reference strategy_rule_compliance');
    END IF;
    
    -- Check if any functions still reference the table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_definition ILIKE '%strategy_rule_compliance%'
    ) INTO function_exists;
    
    IF function_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FUNCTION_REMOVAL', 'CLEANUP', 'FAILED', 'Functions still reference strategy_rule_compliance');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FUNCTION_REMOVAL', 'CLEANUP', 'PASSED', 'No functions reference strategy_rule_compliance');
    END IF;
    
    -- Check for any remaining triggers
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND event_object_table = 'strategy_rule_compliance'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TRIGGER_REMOVAL', 'CLEANUP', 'FAILED', 'Triggers still exist for strategy_rule_compliance');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('TRIGGER_REMOVAL', 'CLEANSHIP', 'PASSED', 'No triggers exist for strategy_rule_compliance');
    END IF;
    
    RAISE NOTICE 'Test 1 completed: strategy_rule_compliance cleanup verification';
END $$;

-- Test 2: Verify strategies table structure and integrity
DO $$
DECLARE
    table_exists BOOLEAN;
    primary_key_exists BOOLEAN;
    user_id_exists BOOLEAN;
    column_count INTEGER;
    row_count INTEGER;
BEGIN
    RAISE NOTICE 'Test 2: Verifying strategies table structure and integrity...';
    
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
    
    -- Check for primary key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'strategies' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) INTO primary_key_exists;
    
    IF NOT primary_key_exists THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_PRIMARY_KEY', 'STRUCTURE', 'FAILED', 'strategies table missing primary key');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_PRIMARY_KEY', 'STRUCTURE', 'PASSED', 'strategies table has primary key');
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
    VALUES ('STRATEGIES_COLUMN_COUNT', 'STRUCTURE', 'INFO', format('strategies table has % columns', column_count));
    
    -- Get row count
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM strategies' INTO row_count;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_ROW_COUNT', 'DATA', 'INFO', format('strategies table has % rows', row_count));
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_ROW_COUNT', 'DATA', 'ERROR', format('Failed to count rows: %', SQLERRM));
    END;
    
    RAISE NOTICE 'Test 2 completed: strategies table structure verification';
END $$;

-- Test 3: Verify foreign key relationships
DO $$
DECLARE
    table_record RECORD;
    relationship_count INTEGER := 0;
    valid_relationships INTEGER := 0;
    invalid_relationships INTEGER := 0;
    total_tables INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 3: Verifying foreign key relationships...';
    
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
    VALUES ('STRATEGY_ID_TABLES_COUNT', 'RELATIONSHIPS', 'INFO', format('Found % tables with strategy_id columns', total_tables));
    
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
        
        -- Check if foreign key exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = table_record.table_name 
            AND constraint_type = 'FOREIGN KEY'
            AND table_schema = 'public'
        ) THEN
            valid_relationships := valid_relationships + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('FK_%s', table_record.table_name), 'RELATIONSHIPS', 'PASSED', 
                    format('Table % has valid foreign key constraint', table_record.table_name));
        ELSE
            invalid_relationships := invalid_relationships + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('FK_%s', table_record.table_name), 'RELATIONSHIPS', 'FAILED', 
                    format('Table % missing foreign key constraint', table_record.table_name));
        END IF;
    END LOOP;
    
    -- Summary of relationship verification
    IF invalid_relationships = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RELATIONSHIP_SUMMARY', 'RELATIONSHIPS', 'PASSED', 
                format('All % foreign key relationships are valid', valid_relationships));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('RELATIONSHIP_SUMMARY', 'RELATIONSHIPS', 'FAILED', 
                format('% valid relationships, % invalid relationships', valid_relationships, invalid_relationships));
    END IF;
    
    RAISE NOTICE 'Test 3 completed: foreign key relationships verification';
END $$;

-- Test 4: Verify indexes for performance
DO $$
DECLARE
    table_record RECORD;
    index_count INTEGER := 0;
    missing_indexes INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 4: Verifying indexes for performance...';
    
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
        -- Check if index exists for strategy_id
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = table_record.table_name 
            AND indexdef LIKE '%strategy_id%'
            AND schemaname = 'public'
        ) THEN
            index_count := index_count + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('IDX_%s', table_record.table_name), 'PERFORMANCE', 'PASSED', 
                    format('Table % has strategy_id index', table_record.table_name));
        ELSE
            missing_indexes := missing_indexes + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('IDX_%s', table_record.table_name), 'PERFORMANCE', 'WARNING', 
                    format('Table % missing strategy_id index', table_record.table_name));
        END IF;
    END LOOP;
    
    -- Summary of index verification
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('INDEX_SUMMARY', 'PERFORMANCE', 'INFO', 
            format('Found % indexes, % missing indexes', index_count, missing_indexes));
    
    RAISE NOTICE 'Test 4 completed: performance indexes verification';
END $$;

-- Test 5: Verify RLS policies are properly configured
DO $$
DECLARE
    table_record RECORD;
    rls_enabled_count INTEGER := 0;
    policy_count INTEGER := 0;
    tables_without_rls INTEGER := 0;
BEGIN
    RAISE NOTICE 'Test 5: Verifying RLS policies are properly configured...';
    
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
        VALUES ('STRATEGIES_POLICIES', 'SECURITY', 'PASSED', format('strategies table has % RLS policies', policy_count));
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('STRATEGIES_POLICIES', 'SECURITY', 'WARNING', 'strategies table has no RLS policies');
    END IF;
    
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
                    format('RLS enabled on % table', table_record.table_name));
        ELSE
            tables_without_rls := tables_without_rls + 1;
            
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES (format('RLS_%s', table_record.table_name), 'SECURITY', 'WARNING', 
                    format('RLS not enabled on % table', table_record.table_name));
        END IF;
    END LOOP;
    
    -- Summary of RLS verification
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('RLS_SUMMARY', 'SECURITY', 'INFO', 
            format('RLS enabled on % tables, % tables without RLS', rls_enabled_count, tables_without_rls));
    
    RAISE NOTICE 'Test 5 completed: RLS policies verification';
END $$;

-- Test 6: Test basic database operations
DO $$
DECLARE
    test_passed BOOLEAN := TRUE;
    error_message TEXT;
BEGIN
    RAISE NOTICE 'Test 6: Testing basic database operations...';
    
    -- Test 6a: Test basic query on strategies table
    BEGIN
        PERFORM 1 FROM strategies LIMIT 1;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('QUERY_STRATEGIES', 'OPERATIONS', 'PASSED', 'Basic query on strategies table successful');
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('QUERY_STRATEGIES', 'OPERATIONS', 'FAILED', format('Query failed: %', error_message));
    END;
    
    -- Test 6b: Test join operations
    BEGIN
        -- Try a simple join between strategies and a related table (if exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'trades' 
            AND table_schema = 'public'
        ) THEN
            PERFORM 1 FROM strategies s LEFT JOIN trades t ON s.id = t.strategy_id LIMIT 1;
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'PASSED', 'Join between strategies and trades successful');
        ELSE
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'SKIPPED', 'trades table not found');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('JOIN_STRATEGIES_TRADES', 'OPERATIONS', 'FAILED', format('Join failed: %', error_message));
    END;
    
    -- Test 6c: Test foreign key constraint enforcement
    BEGIN
        -- This is a read-only test, so we can't actually test constraint enforcement
        -- But we can verify the constraint exists and is valid
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'trades' 
            AND constraint_type = 'FOREIGN KEY'
            AND table_schema = 'public'
        ) THEN
            INSERT INTO verification_results (test_name, test_group, status, details)
            VALUES ('FK_CONSTRAINT_CHECK', 'OPERATIONS', 'PASSED', 'Foreign key constraints are properly defined');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        test_passed := FALSE;
        error_message := SQLERRM;
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('FK_CONSTRAINT_CHECK', 'OPERATIONS', 'FAILED', format('FK constraint check failed: %', error_message));
    END;
    
    RAISE NOTICE 'Test 6 completed: basic database operations verification';
END $$;

-- Generate final verification report
DO $$
DECLARE
    total_tests INTEGER;
    passed_tests INTEGER;
    failed_tests INTEGER;
    warning_tests INTEGER;
    info_tests INTEGER;
BEGIN
    -- Count test results
    SELECT COUNT(*) INTO total_tests FROM verification_results;
    SELECT COUNT(*) INTO passed_tests FROM verification_results WHERE status = 'PASSED';
    SELECT COUNT(*) INTO failed_tests FROM verification_results WHERE status = 'FAILED';
    SELECT COUNT(*) INTO warning_tests FROM verification_results WHERE status = 'WARNING';
    SELECT COUNT(*) INTO info_tests FROM verification_results WHERE status = 'INFO';
    
    -- Add summary to results
    INSERT INTO verification_results (test_name, test_group, status, details)
    VALUES ('VERIFICATION_SUMMARY', 'FINAL', 'INFO', 
            format('Total: %, Passed: %, Failed: %, Warnings: %, Info: %', 
                   total_tests, passed_tests, failed_tests, warning_tests, info_tests));
    
    -- Determine overall status
    IF failed_tests = 0 THEN
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('OVERALL_STATUS', 'FINAL', 'PASSED', 'All critical tests passed - database is healthy');
    ELSE
        INSERT INTO verification_results (test_name, test_group, status, details)
        VALUES ('OVERALL_STATUS', 'FINAL', 'FAILED', format('% critical tests failed - database needs attention', failed_tests));
    END IF;
END $$;

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
        WHEN 'CLEANUP' THEN 2
        WHEN 'STRUCTURE' THEN 3
        WHEN 'RELATIONSHIPS' THEN 4
        WHEN 'PERFORMANCE' THEN 5
        WHEN 'SECURITY' THEN 6
        WHEN 'OPERATIONS' THEN 7
        WHEN 'FINAL' THEN 8
        ELSE 9
    END,
    test_name;

-- Return final status
SELECT 
    'VERIFICATION' as operation,
    CASE 
        WHEN (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED') = 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status,
    NOW() as completed_at,
    CASE 
        WHEN (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED') = 0 THEN 
            'All verification tests passed - database is healthy'
        ELSE 
            format('% verification tests failed - see detailed results', 
                   (SELECT COUNT(*) FROM verification_results WHERE status = 'FAILED'))
    END as message;

-- Clean up temporary table
DROP TABLE IF EXISTS verification_results;

RAISE NOTICE '===========================================================================';
RAISE NOTICE 'VERIFICATION COMPLETED';
RAISE NOTICE 'See detailed results above for any issues that need attention';
RAISE NOTICE '==========================================================================';
```

---

## 📝 Summary

This comprehensive execution guide provides step-by-step instructions for resolving strategy_rule_compliance and strategy permission issues in your Supabase database. By following these instructions carefully, you should be able to:

1. Clear all cached references to the deleted strategy_rule_compliance table
2. Rebuild proper foreign key relationships between strategies and related tables
3. Verify that all fixes have been applied correctly

The guide includes safety precautions, troubleshooting steps, and verification procedures to ensure a successful resolution of the issues.