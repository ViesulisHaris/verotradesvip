-- REMOVE_COMPLIANCE_FUNCTIONALITY.sql
-- This script removes all compliance-related database elements from the VeroTrade Trading Journal

-- Begin transaction to ensure all changes are applied together
BEGIN;

-- Drop compliance-related triggers if they exist
DROP TRIGGER IF EXISTS update_trade_compliance_trigger ON trades;
DROP TRIGGER IF EXISTS calculate_strategy_compliance_trigger ON strategies;

-- Drop compliance-related functions if they exist
DROP FUNCTION IF EXISTS calculate_trade_compliance(trade_id UUID);
DROP FUNCTION IF EXISTS calculate_strategy_compliance(strategy_id UUID);
DROP FUNCTION IF EXISTS get_strategy_compliance_percentage(strategy_id UUID);
DROP FUNCTION IF EXISTS update_trade_compliance_percentage();

-- Drop compliance-related indexes if they exist
DROP INDEX IF EXISTS idx_strategy_rule_compliance_trade_id;
DROP INDEX IF EXISTS idx_strategy_rule_compliance_strategy_id;
DROP INDEX IF EXISTS idx_strategy_rule_compliance_created_at;

-- Drop the strategy_rule_compliance table if it exists
DROP TABLE IF EXISTS strategy_rule_compliance CASCADE;

-- Remove compliance_percentage column from trades table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'compliance_percentage'
    ) THEN
        ALTER TABLE trades DROP COLUMN compliance_percentage;
    END IF;
END $$;

-- Remove any compliance-related RLS policies if they exist
DO $$
BEGIN
    -- Drop policies for strategy_rule_compliance table if they existed
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'strategy_rule_compliance'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own strategy rule compliance" ON strategy_rule_compliance;
        DROP POLICY IF EXISTS "Users can insert own strategy rule compliance" ON strategy_rule_compliance;
        DROP POLICY IF EXISTS "Users can update own strategy rule compliance" ON strategy_rule_compliance;
        DROP POLICY IF EXISTS "Users can delete own strategy rule compliance" ON strategy_rule_compliance;
    END IF;
END $$;

-- Commit the transaction
COMMIT;

-- Verification queries to confirm removal
-- These queries should return no results if the removal was successful

-- Check if strategy_rule_compliance table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'strategy_rule_compliance'
    ) THEN
        RAISE EXCEPTION 'strategy_rule_compliance table still exists';
    ELSE
        RAISE NOTICE 'strategy_rule_compliance table successfully removed';
    END IF;
END $$;

-- Check if compliance_percentage column exists in trades table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'compliance_percentage'
    ) THEN
        RAISE EXCEPTION 'compliance_percentage column still exists in trades table';
    ELSE
        RAISE NOTICE 'compliance_percentage column successfully removed from trades table';
    END IF;
END $$;

-- Check if compliance-related functions exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'calculate_trade_compliance'
    ) THEN
        RAISE EXCEPTION 'calculate_trade_compliance function still exists';
    ELSE
        RAISE NOTICE 'calculate_trade_compliance function successfully removed';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'calculate_strategy_compliance'
    ) THEN
        RAISE EXCEPTION 'calculate_strategy_compliance function still exists';
    ELSE
        RAISE NOTICE 'calculate_strategy_compliance function successfully removed';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'get_strategy_compliance_percentage'
    ) THEN
        RAISE EXCEPTION 'get_strategy_compliance_percentage function still exists';
    ELSE
        RAISE NOTICE 'get_strategy_compliance_percentage function successfully removed';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'update_trade_compliance_percentage'
    ) THEN
        RAISE EXCEPTION 'update_trade_compliance_percentage function still exists';
    ELSE
        RAISE NOTICE 'update_trade_compliance_percentage function successfully removed';
    END IF;
END $$;

-- Check if compliance-related triggers exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'update_trade_compliance_trigger'
    ) THEN
        RAISE EXCEPTION 'update_trade_compliance_trigger still exists';
    ELSE
        RAISE NOTICE 'update_trade_compliance_trigger successfully removed';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'calculate_strategy_compliance_trigger'
    ) THEN
        RAISE EXCEPTION 'calculate_strategy_compliance_trigger still exists';
    ELSE
        RAISE NOTICE 'calculate_strategy_compliance_trigger successfully removed';
    END IF;
END $$;

-- Final confirmation message
RAISE NOTICE 'All compliance-related database elements have been successfully removed';