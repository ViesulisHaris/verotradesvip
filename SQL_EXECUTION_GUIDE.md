# SQL Fix Scripts Execution Guide

## Issue Summary
The application is experiencing two critical issues:
1. When logging a trade: "relation 'strategy_rule_compliance' does not exist"
2. When trying to modify/delete/view strategy in strategy tab: "Strategy not found or you do not have permission to view it"

## Root Cause
Supabase schema cache corruption and missing relationship definitions after the strategy_rule_compliance table was removed.

## Solution
Three SQL scripts need to be executed in the Supabase SQL Editor in the correct order:

### Step 1: SCHEMA_CACHE_CLEAR.sql
**Purpose**: Clears all cached references to the deleted strategy_rule_compliance table

**How to execute**:
1. Open the Supabase Dashboard (https://bzmixuxautbmqbrqtufx.supabase.co)
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `SCHEMA_CACHE_CLEAR.sql`
4. Click "Run" to execute

**Expected output**: Multiple "RAISE NOTICE" messages indicating cache clearing operations

### Step 2: RELATIONSHIP_REBUILD.sql
**Purpose**: Rebuilds foreign key relationships and fixes missing relationship definitions

**How to execute**:
1. In the same SQL Editor, clear the previous content
2. Copy and paste the entire contents of `RELATIONSHIP_REBUILD.sql`
3. Click "Run" to execute

**Expected output**: 
- Relationship analysis results
- Messages about adding foreign keys, indexes, and RLS policies
- A summary table showing all operations performed

### Step 3: VERIFICATION.sql
**Purpose**: Comprehensive verification of all fixes to ensure the database is healthy

**How to execute**:
1. In the same SQL Editor, clear the previous content
2. Copy and paste the entire contents of `VERIFICATION.sql`
3. Click "Run" to execute

**Expected output**:
- Detailed verification results showing each test passed
- Final summary indicating overall status
- Should show "PASSED" for all critical tests

## Manual Verification Steps

After executing all three SQL scripts, verify the fixes by:

### 1. Testing Trade Logging
1. Start the development server: `npm run dev`
2. Navigate to the trade logging page
3. Try to log a new trade
4. **Expected result**: No "strategy_rule_compliance does not exist" error

### 2. Testing Strategy Access
1. Navigate to the Strategies tab
2. Try to view, modify, or delete an existing strategy
3. **Expected result**: No "Strategy not found or you do not have permission to view it" error

## Troubleshooting

### If SQL Execution Fails
1. Ensure you're logged in with appropriate permissions
2. Check that the service role key is valid
3. Try executing smaller portions of the scripts to identify the problematic section

### If Issues Persist After Execution
1. Check the Supabase logs for any error messages
2. Verify that all three scripts were executed successfully
3. Ensure the application is using the correct Supabase URL and keys

## Alternative Execution Method

If the Supabase SQL Editor approach doesn't work, you can:

1. Use a database client like DBeaver or TablePlus
2. Connect using the connection details from Supabase
3. Execute the SQL scripts directly

## Important Notes

- Execute the scripts in the exact order: SCHEMA_CACHE_CLEAR → RELATIONSHIP_REBUILD → VERIFICATION
- Do not skip any scripts as they build upon each other
- The scripts are designed to be safe and will not delete any existing data
- All operations are logged for debugging purposes

## Expected Final State

After successful execution:
- All cached references to strategy_rule_compliance will be cleared
- Foreign key relationships between strategies and related tables will be properly established
- RLS policies will be correctly configured
- Both reported issues should be resolved