# Rollback Procedures for Strategy Fix Implementation

## Overview

This document provides comprehensive rollback procedures for reverting the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql) if issues arise during or after implementation. These procedures ensure minimal downtime and data integrity while restoring the system to a stable state.

## ⚠️ Important Prerequisites

### Before Any Rollback
1. **Assess Impact**: Determine the scope and impact of the issue
2. **Notify Stakeholders**: Inform all relevant teams about the rollback
3. **Schedule Maintenance Window**: Choose low-traffic period for rollback
4. **Prepare Rollback Plan**: Have all necessary scripts and procedures ready
5. **Create Fresh Backup**: Take a complete backup before starting rollback

### Required Access
- Supabase project with admin privileges
- Service role key for database operations
- Access to application deployment systems
- Database backup/restore permissions

## 📋 Rollback Scenarios

### Scenario 1: Partial Rollback (Single Script)
**When to Use**: Only one of the SQL scripts caused issues
**Impact**: Minimal - only specific functionality affected

#### 1A: Rollback SCHEMA_CACHE_CLEAR.sql Only
**Symptoms**:
- Query performance issues
- Cache-related errors
- Strategy_rule_compliance references still appearing

**Rollback Steps**:
1. **Create Backup**:
   ```sql
   -- Create a backup of current state
   CREATE TABLE rollback_backup_strategies AS SELECT * FROM strategies;
   CREATE TABLE rollback_backup_trades AS SELECT * FROM trades;
   -- Repeat for all affected tables
   ```

2. **Restore Cache State**:
   ```sql
   -- Rebuild PostgreSQL cache without clearing
   DISCARD PLANS;
   DISCARD SEQUENCES;
   DISCARD TEMP;
   
   -- Rebuild statistics selectively
   ANALYZE strategies;
   ANALYZE trades;
   ```

3. **Verify Rollback**:
   ```sql
   -- Test basic queries
   SELECT COUNT(*) FROM strategies;
   SELECT COUNT(*) FROM trades;
   
   -- Check for performance improvements
   EXPLAIN ANALYZE SELECT * FROM strategies LIMIT 10;
   ```

#### 1B: Rollback RELATIONSHIP_REBUILD.sql Only
**Symptoms**:
- Foreign key constraint errors
- Relationship issues between tables
- RLS policy problems

**Rollback Steps**:
1. **Create Backup**:
   ```sql
   -- Backup current constraints
   SELECT 
       tc.table_name,
       tc.constraint_name,
       tc.constraint_type
   FROM information_schema.table_constraints tc
   WHERE tc.table_schema = 'public'
   AND tc.constraint_type = 'FOREIGN KEY';
   ```

2. **Remove New Constraints**:
   ```sql
   -- Drop foreign key constraints added by the fix
   ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_strategy_id_fkey;
   ALTER TABLE strategy_performance DROP CONSTRAINT IF EXISTS strategy_performance_strategy_id_fkey;
   -- Repeat for all tables with new constraints
   ```

3. **Restore Original Constraints**:
   ```sql
   -- Restore original constraint definitions
   -- (This would be based on your pre-fix database state)
   ALTER TABLE trades ADD CONSTRAINT original_trades_strategy_fkey 
   FOREIGN KEY (strategy_id) REFERENCES strategies(id);
   ```

4. **Verify Rollback**:
   ```sql
   -- Test constraint integrity
   SELECT 
       tc.table_name,
       tc.constraint_name,
       tc.constraint_type
   FROM information_schema.table_constraints tc
   WHERE tc.table_schema = 'public'
   AND tc.constraint_type = 'FOREIGN KEY';
   ```

### Scenario 2: Full Rollback (All Scripts)
**When to Use**: Multiple issues or system instability after fixes
**Impact**: Significant - all strategy-related functionality affected

#### Full Rollback Steps:
1. **Emergency Assessment** (5 minutes):
   ```sql
   -- Quick health check
   SELECT COUNT(*) FROM strategies;
   SELECT COUNT(*) FROM trades;
   
   -- Check for critical errors
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND wait_event IS NOT NULL;
   ```

2. **Create Emergency Backup** (10 minutes):
   ```sql
   -- Backup all user data
   CREATE TABLE emergency_backup_users AS SELECT * FROM auth.users;
   CREATE TABLE emergency_backup_strategies AS SELECT * FROM strategies;
   CREATE TABLE emergency_backup_trades AS SELECT * FROM trades;
   
   -- Backup critical system tables
   CREATE TABLE emergency_backup_policies AS SELECT * FROM pg_policies;
   ```

3. **Stop Application** (5 minutes):
   - Put application in maintenance mode
   - Stop all background jobs
   - Disconnect all user sessions

4. **Database Rollback** (30 minutes):
   ```sql
   -- Restore from pre-fix backup if available
   -- OR manually revert changes
   
   -- Step 1: Remove new indexes
   DROP INDEX IF EXISTS trades_strategy_id_idx;
   DROP INDEX IF EXISTS strategy_performance_strategy_id_idx;
   
   -- Step 2: Remove new RLS policies
   DROP POLICY IF EXISTS trades_user_policy ON trades;
   DROP POLICY IF EXISTS strategies_user_policy ON strategies;
   
   -- Step 3: Restore original table structures
   -- (This depends on your specific pre-fix state)
   ```

5. **Verification** (15 minutes):
   ```sql
   -- Comprehensive verification
   -- Test 1: Basic functionality
   SELECT COUNT(*) FROM strategies;
   SELECT COUNT(*) FROM trades;
   
   -- Test 2: Application functionality
   -- (Test through application UI)
   
   -- Test 3: Performance
   EXPLAIN ANALYZE SELECT s.*, t.* FROM strategies s LEFT JOIN trades t ON s.id = t.strategy_id LIMIT 100;
   ```

6. **Restore Application** (10 minutes):
   - Take application out of maintenance mode
   - Restart application services
   - Monitor for errors

### Scenario 3: Data-Only Rollback
**When to Use**: Data corruption or incorrect data modifications
**Impact**: Data integrity issues

#### Data-Only Rollback Steps:
1. **Isolate Affected Data**:
   ```sql
   -- Identify affected records
   SELECT * FROM strategies WHERE created_at > 'fix_timestamp';
   SELECT * FROM trades WHERE created_at > 'fix_timestamp';
   ```

2. **Restore Data from Backup**:
   ```sql
   -- Restore specific tables
   DELETE FROM strategies WHERE created_at > 'fix_timestamp';
   INSERT INTO strategies SELECT * FROM backup_strategies WHERE created_at > 'fix_timestamp';
   
   -- Re-apply any post-fix legitimate changes carefully
   ```

3. **Verify Data Integrity**:
   ```sql
   -- Check referential integrity
   SELECT COUNT(*) FROM trades t WHERE NOT EXISTS (SELECT 1 FROM strategies s WHERE s.id = t.strategy_id);
   
   -- Check for duplicates
   SELECT user_id, COUNT(*) FROM strategies GROUP BY user_id HAVING COUNT(*) > 1;
   ```

## 🔧 Rollback Scripts

### Automated Rollback Script
Create `rollback-strategy-fixes.js`:

```javascript
/**
 * Automated Rollback Script for Strategy Fixes
 * 
 * Usage: node rollback-strategy-fixes.js [environment] [rollback-type]
 * Environment: 'development' or 'production'
 * Rollback-type: 'full', 'partial', or 'data-only'
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const environment = process.argv[2] || 'development';
const rollbackType = process.argv[3] || 'full';

console.log(`🔄 Starting rollback for ${environment} environment`);
console.log(`📋 Rollback type: ${rollbackType}`);
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Implementation would go here
```

### SQL Rollback Scripts

#### rollback-schema-cache.sql
```sql
-- ROLLBACK_SCHEMA_CACHE.sql
-- Purpose: Rollback changes made by SCHEMA_CACHE_CLEAR.sql

-- Step 1: Rebuild cache without full clear
DISCARD PLANS;
DISCARD SEQUENCES;
DISCARD TEMP;

-- Step 2: Rebuild statistics for key tables only
ANALYZE strategies;
ANALYZE trades;

-- Step 3: Verify cache state
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND tablename IN ('strategies', 'trades');

-- Log rollback completion
INSERT INTO rollback_log (operation, status, timestamp)
VALUES ('ROLLBACK_SCHEMA_CACHE', 'COMPLETED', NOW());
```

#### rollback-relationships.sql
```sql
-- ROLLBACK_RELATIONSHIPS.sql
-- Purpose: Rollback changes made by RELATIONSHIP_REBUILD.sql

-- Step 1: Remove new foreign key constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%strategy_id_fkey'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                     constraint_record.table_name, constraint_record.constraint_name);
    END LOOP;
END $$;

-- Step 2: Remove new indexes
DO $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT tablename, indexname
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname LIKE '%strategy_id_idx'
        AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', index_record.indexname);
    END LOOP;
END $$;

-- Step 3: Verify relationship state
SELECT 
    tc.table_name,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name;

-- Log rollback completion
INSERT INTO rollback_log (operation, status, timestamp)
VALUES ('ROLLBACK_RELATIONSHIPS', 'COMPLETED', NOW());
```

#### rollback-full.sql
```sql
-- ROLLBACK_FULL.sql
-- Purpose: Complete rollback of all strategy fixes

-- Step 1: Create rollback log table
CREATE TABLE IF NOT EXISTS rollback_log (
    id SERIAL PRIMARY KEY,
    operation TEXT,
    status TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Step 2: Execute partial rollbacks
\i rollback-schema-cache.sql
\i rollback-relationships.sql

-- Step 3: Additional cleanup if needed
-- (Add any additional cleanup steps specific to your implementation)

-- Step 4: Verify system state
SELECT 'strategies' as table_name, COUNT(*) as record_count FROM strategies
UNION ALL
SELECT 'trades' as table_name, COUNT(*) as record_count FROM trades
UNION ALL
SELECT 'rollback_log' as table_name, COUNT(*) as record_count FROM rollback_log;

-- Final verification
SELECT 'FULL_ROLLBACK_COMPLETED' as status, NOW() as timestamp;
```

## 📊 Rollback Verification

### Post-Rollback Checklist
1. **Database Verification**:
   - [ ] All tables exist and have correct structure
   - [ ] Foreign key relationships are intact
   - [ ] Indexes are appropriate
   - [ ] RLS policies are working
   - [ ] No orphaned records exist

2. **Application Verification**:
   - [ ] Application starts without errors
   - [ ] Users can log in successfully
   - [ ] Strategy creation works
   - [ ] Trade logging works
   - [ ] No strategy_rule_compliance errors
   - [ ] Performance is acceptable

3. **Integration Verification**:
   - [ ] All API endpoints respond correctly
   - [ ] Database queries perform well
   - [ ] No error logs in application
   - [ ] User data is intact
   - [ ] No data corruption

### Automated Verification Script
```javascript
// verify-rollback.js
const { createClient } = require('@supabase/supabase-js');

async function verifyRollback(environment) {
  const client = createClient(url, serviceKey);
  
  const checks = [
    { name: 'Strategies Table', test: () => client.from('strategies').select('count').single() },
    { name: 'Trades Table', test: () => client.from('trades').select('count').single() },
    { name: 'Strategy-Trade Join', test: () => client.from('strategies').select('*, trades(*)').eq('id', 'test-id').single() }
  ];
  
  for (const check of checks) {
    try {
      await check.test();
      console.log(`✅ ${check.name}: OK`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}
```

## 🚨 Emergency Procedures

### Immediate Actions (First 5 Minutes)
1. **Assess Situation**:
   - Identify affected users and functionality
   - Determine if immediate rollback is needed
   - Check for data corruption

2. **Communication**:
   - Notify all stakeholders of the issue
   - Send alert to monitoring systems
   - Document the problem and timeline

3. **Stabilization**:
   - If possible, implement hotfix instead of full rollback
   - Monitor system for additional issues
   - Prepare for rollback if needed

### Critical Failure Handling
If any of these conditions occur, initiate immediate rollback:

1. **Data Loss**: Any user data is lost or corrupted
2. **System Unavailability**: Application is completely down
3. **Security Breach**: Unauthorized access to data
4. **Performance Degradation**: >90% performance drop
5. **Critical Errors**: >100 errors per minute

### Emergency Contact Information
- **Database Administrator**: [DBA contact info]
- **Development Team**: [Dev team contact info]
- **Operations Team**: [Ops team contact info]
- **Management**: [Management contact info]

## 📈 Monitoring During Rollback

### Key Metrics to Watch
1. **Database Performance**:
   - Query execution times
   - Connection pool usage
   - Lock wait times
   - Error rates

2. **Application Performance**:
   - Response times
   - Error rates
   - User session counts
   - Feature usage statistics

3. **System Health**:
   - CPU and memory usage
   - Disk I/O rates
   - Network latency
   - Service availability

### Alert Thresholds
```javascript
const alertThresholds = {
  database: {
    queryTimeMs: 5000,
    errorRate: 0.05, // 5%
    connectionPoolUsage: 0.9
  },
  application: {
    responseTimeMs: 2000,
    errorRate: 0.02, // 2%
    activeUsers: 10 // Minimum expected
  },
  system: {
    cpuUsage: 0.8,
    memoryUsage: 0.85,
    diskIO: 0.9,
    networkLatency: 500 // ms
  }
};
```

## 📝 Documentation Requirements

### Rollback Report Template
```
# Rollback Report

## Executive Summary
- **Date**: [Date of rollback]
- **Time**: [Time of rollback]
- **Reason**: [Reason for rollback]
- **Impact**: [Impact assessment]
- **Duration**: [Time taken to rollback]

## Technical Details
- **Environment**: [Development/Production]
- **Rollback Type**: [Full/Partial/Data-only]
- **Scripts Executed**: [List of scripts]
- **Tables Affected**: [List of affected tables]
- **Records Affected**: [Number of records impacted]

## Verification Results
- **Database Tests**: [Pass/Fail]
- **Application Tests**: [Pass/Fail]
- **Performance Tests**: [Pass/Fail]
- **User Acceptance**: [Pass/Fail]

## Lessons Learned
- **Root Cause**: [Analysis of what went wrong]
- **Prevention Measures**: [How to prevent recurrence]
- **Improvement Suggestions**: [Process improvements]

## Next Steps
- **Monitoring Plan**: [Enhanced monitoring procedures]
- **Testing Plan**: [Additional testing requirements]
- **Implementation Schedule**: [When to re-attempt fixes]
```

## ✅ Rollback Completion Criteria

A rollback is considered complete when:

1. **All Critical Tests Pass**:
   - Users can authenticate
   - Strategies are accessible
   - Trades can be created
   - No strategy_rule_compliance errors
   - Data integrity is maintained

2. **Performance is Restored**:
   - Query times are within acceptable limits
   - Application response times are normal
   - System resource usage is stable

3. **Documentation is Complete**:
   - Rollback report is filed
   - Incident report is created
   - Lessons learned are documented
   - Stakeholders are notified

4. **Monitoring is Active**:
   - All systems are being monitored
   - Alert thresholds are configured
   - Emergency procedures are in place

## 🔄 Post-Rollback Actions

### Immediate (Next 24 Hours)
1. **Enhanced Monitoring**: Implement additional monitoring for affected systems
2. **User Communication**: Notify users of resolution and any impacts
3. **Incident Review**: Conduct post-mortem analysis
4. **Process Review**: Evaluate rollback procedures and improve

### Short-term (Next Week)
1. **Fix Analysis**: Detailed analysis of what went wrong
2. **Testing Enhancement**: Improve test coverage for similar issues
3. **Documentation Update**: Update all relevant documentation
4. **Team Training**: Train team on lessons learned

### Long-term (Next Month)
1. **Architecture Review**: Review system architecture for resilience
2. **Process Improvement**: Implement improved deployment procedures
3. **Tool Enhancement**: Acquire better monitoring and rollback tools
4. **Knowledge Sharing**: Share lessons with other teams

---

## 📞 Support and Escalation

If rollback procedures fail or additional issues arise:

1. **Level 1 Support**: On-call engineering team
2. **Level 2 Support**: Engineering management
3. **Level 3 Support**: Executive leadership
4. **External Support**: Supabase support, external consultants

### Contact Information
- **Primary Support**: [Primary support contact]
- **Backup Support**: [Backup support contact]
- **Emergency Escalation**: [Emergency contact]
- **Vendor Support**: [Supabase/other vendor contacts]

---

This rollback procedures document should be regularly reviewed, tested, and updated to ensure it remains effective for handling any issues that may arise from strategy fix implementations.