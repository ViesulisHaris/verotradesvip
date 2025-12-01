-- =====================================================
-- COMPREHENSIVE DATABASE RESTRICTIONS DIAGNOSTIC SCRIPT
-- =====================================================
-- Purpose: Investigate potential database restrictions causing UUID errors
-- Focus: Strategy-related tables (strategies, trades, strategy_rules, users)
-- Safety: Read-only operations only
-- =====================================================

-- Set up output formatting
\echo '======================================================'
\echo 'DATABASE RESTRICTIONS DIAGNOSTIC REPORT'
\echo 'Generated at: ' || now()
\echo '======================================================'

-- =====================================================
-- SECTION 1: TABLE STRUCTURE OVERVIEW
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 1: TABLE STRUCTURE OVERVIEW'
\echo '======================================================'

-- Get basic table information for strategy-related tables
SELECT 
    'TABLE_OVERVIEW' as section,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
ORDER BY tablename;

-- =====================================================
-- SECTION 2: UUID COLUMN CONSTRAINTS ANALYSIS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 2: UUID COLUMN CONSTRAINTS ANALYSIS'
\echo '======================================================'

-- Check all UUID columns and their constraints
SELECT 
    'UUID_COLUMNS' as section,
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE c.table_name IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND (c.data_type = 'uuid' OR c.data_type LIKE '%uuid%')
ORDER BY t.table_name, c.column_name;

-- =====================================================
-- SECTION 3: FOREIGN KEY RELATIONSHIPS INVOLVING UUIDS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 3: FOREIGN KEY RELATIONSHIPS INVOLVING UUIDS'
\echo '======================================================'

-- Examine foreign key relationships that might cause UUID issues
SELECT 
    'FOREIGN_KEYS' as section,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND (kcu.column_name LIKE '%id%' OR ccu.column_name LIKE '%id%')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES'
\echo '======================================================'

-- Check if RLS is enabled on strategy tables
SELECT 
    'RLS_STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND rowsecurity = true;

-- Check RLS policies that might affect UUID operations
SELECT 
    'RLS_POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- SECTION 5: COLUMN-LEVEL PERMISSIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 5: COLUMN-LEVEL PERMISSIONS'
\echo '======================================================'

-- Check column-level permissions on UUID columns
SELECT 
    'COLUMN_PERMISSIONS' as section,
    grantee,
    table_schema,
    table_name,
    column_name,
    privilege_type,
    is_grantable
FROM information_schema.column_privileges 
WHERE table_name IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND column_name LIKE '%id%'
ORDER BY table_name, column_name, grantee;

-- =====================================================
-- SECTION 6: TABLE-LEVEL PERMISSIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 6: TABLE-LEVEL PERMISSIONS'
\echo '======================================================'

-- Check table-level permissions
SELECT 
    'TABLE_PERMISSIONS' as section,
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
ORDER BY table_name, grantee, privilege_type;

-- =====================================================
-- SECTION 7: DATABASE TRIGGERS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 7: DATABASE TRIGGERS'
\echo '======================================================'

-- Check triggers that might affect UUID operations
SELECT 
    'TRIGGERS' as section,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SECTION 8: INDEX USAGE ANALYSIS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 8: INDEX USAGE ANALYSIS'
\echo '======================================================'

-- Check indexes on UUID columns
SELECT 
    'INDEXES' as section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND (indexdef LIKE '%uuid%' OR indexdef LIKE '%id%')
ORDER BY tablename, indexname;

-- Check index statistics for potential performance issues
SELECT 
    'INDEX_STATS' as section,
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    AND tablename IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
ORDER BY tablename, indexname;

-- =====================================================
-- SECTION 9: USER ROLE PERMISSIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 9: USER ROLE PERMISSIONS'
\echo '======================================================'

-- Check current user and their roles
SELECT 
    'CURRENT_USER' as section,
    current_user as username,
    session_user as session_user;

-- Check role memberships
SELECT 
    'ROLE_MEMBERSHIPS' as section,
    rolname as role_name,
    rolsuper as is_super,
    rolcreaterole as can_create_role,
    rolcreatedb as can_create_db,
    rolcanlogin as can_login,
    rolreplication as can_replicate
FROM pg_roles 
WHERE rolname = current_user
   OR rolname IN (SELECT role FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user));

-- =====================================================
-- SECTION 10: SUPABASE-SPECIFIC CHECKS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 10: SUPABASE-SPECIFIC CHECKS'
\echo '====================================================='

-- Check for Supabase auth schema tables
SELECT 
    'SUPABASE_AUTH_TABLES' as section,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
    AND tablename IN ('users', 'sessions', 'instances')
ORDER BY tablename;

-- Check for Supabase storage schema
SELECT 
    'SUPABASE_STORAGE_TABLES' as section,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Check for Supabase functions that might affect UUID operations
SELECT 
    'SUPABASE_FUNCTIONS' as section,
    routine_schema,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema IN ('auth', 'storage', 'extensions')
    AND (routine_name LIKE '%uuid%' OR routine_name LIKE '%auth%')
ORDER BY routine_schema, routine_name;

-- =====================================================
-- SECTION 11: CUSTOM DATABASE FUNCTIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 11: CUSTOM DATABASE FUNCTIONS'
\echo '====================================================='

-- Check for custom functions that might interfere with UUID operations
SELECT 
    'CUSTOM_FUNCTIONS' as section,
    routine_schema,
    routine_name,
    routine_type,
    data_type,
    external_language
FROM information_schema.routines 
WHERE routine_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'extensions')
    AND (routine_name LIKE '%uuid%' OR routine_name LIKE '%strategy%' OR routine_name LIKE '%trade%')
ORDER BY routine_schema, routine_name;

-- =====================================================
-- SECTION 12: CHECK CONSTRAINTS ON UUID COLUMNS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 12: CHECK CONSTRAINTS ON UUID COLUMNS'
\echo '====================================================='

-- Detailed check constraints analysis
SELECT 
    'CHECK_CONSTRAINTS' as section,
    tc.table_name,
    ccu.column_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name IN ('strategies', 'trades', 'strategy_rules', 'users', 'profiles')
    AND tc.constraint_type = 'CHECK'
    AND (ccu.column_name LIKE '%id%' OR cc.check_clause LIKE '%uuid%')
ORDER BY tc.table_name, ccu.column_name;

-- =====================================================
-- SECTION 13: DOMAIN TYPES THAT MIGHT AFFECT UUIDS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 13: DOMAIN TYPES THAT MIGHT AFFECT UUIDS'
\echo '====================================================='

-- Check for custom domain types that might affect UUID handling
SELECT 
    'DOMAIN_TYPES' as section,
    domain_schema,
    domain_name,
    data_type,
    character_maximum_length,
    collation_catalog,
    collation_schema,
    collation_name
FROM information_schema.domains 
WHERE data_type = 'uuid'
   OR domain_name LIKE '%uuid%'
   OR domain_name LIKE '%id%'
ORDER BY domain_schema, domain_name;

-- =====================================================
-- SECTION 14: EXTENSIONS THAT MIGHT AFFECT UUID OPERATIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 14: EXTENSIONS THAT MIGHT AFFECT UUID OPERATIONS'
\echo '====================================================='

-- Check installed extensions
SELECT 
    'EXTENSIONS' as section,
    extname as extension_name,
    extversion as version,
    extrelocatable as relocatable,
    extconfig as configuration_tables
FROM pg_extension 
WHERE extname LIKE '%uuid%' 
   OR extname LIKE '%auth%'
   OR extname LIKE '%security%'
ORDER BY extname;

-- =====================================================
-- SECTION 15: RECOMMENDATIONS BASED ON FINDINGS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 15: RECOMMENDATIONS BASED ON FINDINGS'
\echo '======================================================'

-- This section provides recommendations based on common UUID-related issues
SELECT 
    'RECOMMENDATIONS' as section,
    'Check for NULL UUID values in foreign key columns' as recommendation,
    'Ensure all UUID columns have proper NOT NULL constraints where required' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Verify RLS policies allow UUID operations for current user' as recommendation,
    'Row Level Security might be blocking UUID operations even if table permissions exist' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Check for CHECK constraints that might validate UUID format' as recommendation,
    'Custom CHECK constraints might reject valid UUIDs if format validation is too strict' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Review triggers that modify UUID values' as recommendation,
    'BEFORE INSERT/UPDATE triggers might be changing UUID values to invalid formats' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Verify column-level permissions on UUID columns' as recommendation,
    'Even with table permissions, specific UUID columns might have restricted access' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Check for domain types with UUID constraints' as recommendation,
    'Custom domain types might have additional validation that rejects UUIDs' as details
UNION ALL
SELECT 
    'RECOMMENDATIONS' as section,
    'Review Supabase-specific auth functions' as recommendation,
    'Supabase auth system might have specific UUID handling requirements' as details;

-- =====================================================
-- SECTION 16: SAMPLE QUERIES FOR TESTING UUID OPERATIONS
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'SECTION 16: SAMPLE QUERIES FOR TESTING UUID OPERATIONS'
\echo '======================================================'

-- Provide sample queries for testing UUID operations (commented out for safety)
\echo '-- Sample queries for testing UUID operations (uncomment to execute):'
\echo '-- Test UUID generation:'
\echo '-- SELECT gen_random_uuid() as test_uuid;'
\echo ''
\echo '-- Test UUID parsing:'
\echo '-- SELECT gen_random_uuid()::text as uuid_text;'
\echo ''
\echo '-- Test current user permissions on strategy table:'
\echo '-- SELECT has_table_privilege(current_user, 'strategies', 'SELECT') as can_select;'
\echo '-- SELECT has_table_privilege(current_user, 'strategies', 'INSERT') as can_insert;'
\echo '-- SELECT has_table_privilege(current_user, 'strategies', 'UPDATE') as can_update;'
\echo '-- SELECT has_table_privilege(current_user, 'strategies', 'DELETE') as can_delete;'
\echo ''
\echo '-- Test specific column permissions:'
\echo '-- SELECT has_column_privilege(current_user, 'strategies', 'id', 'SELECT') as can_select_id;'
\echo '-- SELECT has_column_privilege(current_user, 'strategies', 'id', 'UPDATE') as can_update_id;'

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
\echo ''
\echo '======================================================'
\echo 'DIAGNOSTIC SCRIPT COMPLETED'
\echo 'Review the output above for potential database restrictions'
\echo 'that might be causing UUID-related errors'
\echo '======================================================'