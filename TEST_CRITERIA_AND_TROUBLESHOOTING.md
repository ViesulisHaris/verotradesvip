# Test Criteria and Troubleshooting Guide for Strategy Fix Implementation

## Overview

This document provides comprehensive pass/fail criteria for testing the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql) and detailed troubleshooting guidance for common issues that may arise during testing.

## ✅ Success Criteria

### Database Level Success Criteria

#### 1. Schema Cache Clearing
- **PASS**: No references to `strategy_rule_compliance` table remain in any database objects
- **PASS**: All cached query plans are rebuilt and no cache-related errors occur
- **PASS**: Database performance improves or remains stable after cache clearing
- **PASS**: No error messages containing "strategy_rule_compliance" appear in logs

#### 2. Relationship Rebuilding
- **PASS**: All foreign key relationships between strategies and related tables are valid
- **PASS**: Indexes exist on all `strategy_id` columns for optimal performance
- **PASS**: Row Level Security (RLS) policies are enabled and correctly configured
- **PASS**: No orphaned records exist in related tables

#### 3. Verification Tests
- **PASS**: All verification tests in VERIFICATION.sql return "PASSED" status
- **PASS**: No critical failures in any verification category
- **PASS**: Database structure matches expected post-fix state

### Application Level Success Criteria

#### 1. Trade Logging Functionality
- **PASS**: Trades can be created without "relation 'strategy_rule_compliance' does not exist" errors
- **PASS**: Strategy selection works correctly in trade forms
- **PASS**: Trades are properly associated with strategies via foreign key relationships
- **PASS**: Trade queries with strategy joins execute within acceptable time limits (<2 seconds)

#### 2. Strategy CRUD Operations
- **PASS**: Strategies can be created, read, updated, and deleted without errors
- **PASS**: Strategy operations respect user permissions (users only see their own strategies)
- **PASS**: Strategy data integrity is maintained during all CRUD operations
- **PASS**: No "Strategy not found or you do not have permission to view it" errors for valid operations

#### 3. Strategy Permissions
- **PASS**: Users can access their own strategies without permission errors
- **PASS**: Users cannot access other users' strategies (proper isolation)
- **PASS**: Unauthenticated users cannot access any strategy data
- **PASS**: Admin users have appropriate elevated access where configured

#### 4. End-to-End Workflows
- **PASS**: Complete user workflows (strategy creation → trade logging → analytics) function correctly
- **PASS**: Data remains consistent throughout the workflow
- **PASS**: Performance remains acceptable throughout complex operations
- **PASS**: No data corruption or loss occurs during workflows

### Performance Success Criteria

#### 1. Query Performance
- **PASS**: Strategy queries complete in <500ms for development, <300ms for production
- **PASS**: Trade queries complete in <1 second for development, <500ms for production
- **PASS**: Strategy-trades join queries complete in <2 seconds for development, <1 second for production
- **PASS**: No query timeouts occur during normal operations

#### 2. System Performance
- **PASS**: Database connection pool usage remains <80%
- **PASS**: CPU usage remains <70% during normal operations
- **PASS**: Memory usage remains stable and within expected limits
- **PASS**: No significant increase in error rates (>1%) after fixes

## ❌ Failure Criteria

### Critical Failure Conditions

#### 1. Database Level Failures
- **FAIL**: Any "strategy_rule_compliance" references remain after fixes
- **FAIL**: Foreign key relationships are broken or missing
- **FAIL**: RLS policies are not working correctly
- **FAIL**: Database corruption or data loss occurs
- **FAIL**: Verification tests show critical failures

#### 2. Application Level Failures
- **FAIL**: Trade logging still produces "relation does not exist" errors
- **FAIL**: Users cannot access their strategies due to permission errors
- **FAIL**: Strategy operations fail with unexpected errors
- **FAIL**: Data isolation between users is compromised
- **FAIL**: Application crashes or becomes unresponsive

#### 3. Performance Failures
- **FAIL**: Query times exceed acceptable thresholds by >50%
- **FAIL**: System resource usage exceeds safe limits
- **FAIL**: Error rates increase by >5% after fixes
- **FAIL**: Timeout errors occur during normal operations

## 🔧 Troubleshooting Guide

### Issue 1: strategy_rule_compliance Errors Persist

#### Symptoms
- Error messages: "relation 'strategy_rule_compliance' does not exist"
- Application crashes when accessing strategy-related features
- Trade logging fails with strategy selection

#### Root Causes
1. **Incomplete Cache Clearing**: PostgreSQL still has cached references
2. **Application-Level Cache**: Application layer still has cached query plans
3. **Remaining References**: Views, functions, or triggers still reference the table
4. **Replication Lag**: Database replicas haven't received the changes

#### Troubleshooting Steps
1. **Verify Cache Clearing**:
   ```sql
   -- Check for remaining references
   SELECT * FROM information_schema.views 
   WHERE view_definition ILIKE '%strategy_rule_compliance%';
   
   SELECT * FROM information_schema.routines 
   WHERE routine_definition ILIKE '%strategy_rule_compliance%';
   
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'strategy_rule_compliance';
   ```

2. **Clear Application Cache**:
   - Restart application server
   - Clear any Redis/application caches
   - Force refresh of database connections

3. **Check Replication Status**:
   ```sql
   -- For PostgreSQL replicas
   SELECT * FROM pg_stat_replication;
   
   -- Check lag between primary and replica
   SELECT pg_last_xact_receive_timestamp(), pg_last_xact_replay_timestamp();
   ```

4. **Re-execute Scripts**:
   ```bash
   # Run scripts again with verbose logging
   psql -v -f SCHEMA_CACHE_CLEAR.sql
   psql -v -f RELATIONSHIP_REBUILD.sql
   ```

### Issue 2: Strategy Permission Errors

#### Symptoms
- Error: "Strategy not found or you do not have permission to view it"
- Users can't access their own strategies
- Inconsistent permission behavior between users

#### Root Causes
1. **RLS Policy Issues**: Row Level Security policies are incorrect
2. **Missing User ID**: Strategy records don't have proper user_id associations
3. **Policy Conflicts**: Multiple RLS policies conflict with each other
4. **Authentication Problems**: User sessions not properly associated with database roles

#### Troubleshooting Steps
1. **Verify RLS Policies**:
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('strategies', 'trades');
   
   -- Check existing policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('strategies', 'trades');
   ```

2. **Test Policy Effectiveness**:
   ```sql
   -- Test with different user contexts
   SET ROLE authenticated;
   SET auth.uid() = 'test-user-id';
   
   -- Try to access data
   SELECT * FROM strategies LIMIT 1;
   
   -- Reset context
   RESET ROLE;
   RESET auth.uid();
   ```

3. **Verify User Associations**:
   ```sql
   -- Check for strategies without user_id
   SELECT id, name FROM strategies WHERE user_id IS NULL;
   
   -- Check for duplicate user associations
   SELECT user_id, COUNT(*) FROM strategies GROUP BY user_id HAVING COUNT(*) > 1;
   ```

4. **Test Authentication Flow**:
   - Verify user login process
   - Check session creation
   - Validate token generation and verification

### Issue 3: Performance Degradation

#### Symptoms
- Slow query performance after fixes
- Increased database connection times
- Application timeouts or delays
- High resource utilization

#### Root Causes
1. **Missing Indexes**: New foreign key relationships lack proper indexes
2. **Inefficient RLS Policies**: RLS policies cause performance issues
3. **Statistics Not Updated**: Database statistics are stale after schema changes
4. **Connection Pool Issues**: Database connection pool is misconfigured

#### Troubleshooting Steps
1. **Analyze Query Performance**:
   ```sql
   -- Check query execution plans
   EXPLAIN ANALYZE SELECT s.*, t.* FROM strategies s LEFT JOIN trades t ON s.id = t.strategy_id LIMIT 10;
   
   -- Check for missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation 
   FROM pg_stats 
   WHERE tablename IN ('strategies', 'trades')
   AND attname = 'strategy_id';
   ```

2. **Update Statistics**:
   ```sql
   -- Force update table statistics
   ANALYZE strategies;
   ANALYZE trades;
   ANALYZE strategy_performance;
   -- Repeat for all affected tables
   ```

3. **Check Index Usage**:
   ```sql
   -- Monitor index effectiveness
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
   FROM pg_stat_user_indexes 
   WHERE tablename IN ('strategies', 'trades');
   ```

4. **Optimize RLS Policies**:
   ```sql
   -- Check policy performance impact
   SELECT schemaname, tablename, policyname, calls 
   FROM pg_stat_user_functions 
   WHERE funcname LIKE 'policy%';
   ```

### Issue 4: Data Integrity Problems

#### Symptoms
- Orphaned trade records (trades without valid strategies)
- Inconsistent data between related tables
- Foreign key constraint violations

#### Root Causes
1. **Incomplete Migration**: Data migration didn't complete successfully
2. **Constraint Issues**: Foreign key constraints are not properly enforced
3. **Concurrent Access**: Simultaneous operations caused data inconsistencies
4. **Backup/Restore Problems**: Data restoration process introduced issues

#### Troubleshooting Steps
1. **Check Referential Integrity**:
   ```sql
   -- Find orphaned trades
   SELECT t.id, t.symbol, t.strategy_id 
   FROM trades t 
   LEFT JOIN strategies s ON t.strategy_id = s.id 
   WHERE s.id IS NULL;
   
   -- Check for invalid strategy references
   SELECT DISTINCT strategy_id FROM trades 
   WHERE strategy_id NOT IN (SELECT id FROM strategies);
   ```

2. **Verify Constraint Enforcement**:
   ```sql
   -- Check foreign key constraint status
   SELECT tc.table_name, tc.constraint_name, tc.constraint_type, tc.is_deferrable 
   FROM information_schema.table_constraints tc 
   WHERE tc.constraint_type = 'FOREIGN KEY'
   AND tc.table_name IN ('strategies', 'trades');
   ```

3. **Validate Data Consistency**:
   ```sql
   -- Check for data consistency issues
   SELECT 
       s.id as strategy_id,
       s.user_id,
       COUNT(t.id) as trade_count,
       SUM(t.quantity) as total_quantity
   FROM strategies s 
   LEFT JOIN trades t ON s.id = t.strategy_id 
   GROUP BY s.id, s.user_id;
   ```

## 📊 Test Result Interpretation

### Understanding Test Reports

#### 1. Individual Test Scripts
Each test script generates a JSON report with:
- **Test Name**: Specific test being run
- **Status**: PASSED, FAILED, or SKIPPED
- **Message**: Description of result
- **Details**: Additional context or error information
- **Timestamp**: When the test was executed

#### 2. Combined Test Runner
The `run-tests.js` script produces a summary report with:
- **Environment**: development or production
- **Test Type**: Which tests were run
- **Results Summary**: Overall pass/fail counts
- **Performance Metrics**: Execution times and resource usage
- **Configuration**: Test environment settings used

#### 3. Interpreting Results
- **All PASSED**: Fixes are working correctly
- **Some FAILED**: Review failed tests and apply targeted fixes
- **Many SKIPPED**: Check environment configuration and prerequisites

### Decision Matrix

| Result Pattern | Action | Priority |
|---------------|--------|----------|
| All critical tests PASSED | Proceed to production | High |
| All tests PASSED, some non-critical FAILED | Fix minor issues, then proceed | Medium |
| Critical tests FAILED | Fix issues before proceeding | High |
| Performance tests FAILED | Optimize before proceeding | Medium |
| Permission tests FAILED | Fix security issues immediately | Critical |

## 🚨 Emergency Procedures

### Immediate Response (First 15 Minutes)

1. **Assess Impact**:
   - Determine affected user count
   - Identify critical functionality impacted
   - Estimate business impact

2. **Communication**:
   - Notify all stakeholders
   - Post status updates
   - Establish communication channels

3. **Stabilization**:
   - If needed, temporarily disable affected features
   - Implement hotfixes for critical issues
   - Increase monitoring frequency

### Escalation Criteria

Escalate to emergency response if:

1. **Data Loss**: Any user data is lost or corrupted
2. **System Down**: Application is completely unavailable
3. **Security Breach**: Unauthorized access to data is detected
4. **Performance Critical**: >90% degradation in key metrics
5. **User Impact**: >25% of users affected by critical issues

## 📈 Continuous Monitoring

### Key Metrics to Track

#### 1. Database Performance
```sql
-- Create monitoring view for strategy operations
CREATE OR REPLACE VIEW strategy_performance_monitor AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as operation_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
FROM strategy_operation_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

#### 2. Application Metrics
- Strategy creation success rate
- Trade logging success rate
- User authentication success rate
- API response times
- Error rates by operation type

#### 3. System Health
- Database connection pool usage
- CPU and memory utilization
- Disk I/O rates
- Network latency

### Alert Thresholds
```javascript
const alertThresholds = {
  critical: {
    errorRate: 0.05, // 5%
    responseTime: 5000, // 5 seconds
    failureRate: 0.1,  // 10%
    systemLoad: 0.9   // 90%
  },
  warning: {
    errorRate: 0.02, // 2%
    responseTime: 2000, // 2 seconds
    failureRate: 0.05, // 5%
    systemLoad: 0.75   // 75%
  }
};
```

## 📝 Documentation Requirements

### Test Documentation
1. **Pre-Test Documentation**:
   - System state before fixes
   - Backup verification
   - Rollback plan preparation

2. **Test Execution Records**:
   - All test scripts executed
   - Results and outputs
   - Performance metrics
   - Issues encountered and resolutions

3. **Post-Test Documentation**:
   - Final system state
   - Comparison with expected results
   - Outstanding issues and action plans
   - Lessons learned and improvements

### Knowledge Base Articles
Create documentation for:

1. **Common Issues and Solutions**:
   - strategy_rule_compliance errors
   - Permission problems
   - Performance issues
   - Data integrity problems

2. **Troubleshooting Procedures**:
   - Step-by-step guides
   - Diagnostic queries
   - Recovery procedures

3. **Best Practices**:
   - Testing procedures
   - Monitoring setup
   - Prevention measures

## 🔮 Future Prevention

### Code Review Checklist
- [ ] All database changes reviewed for security implications
- [ ] Foreign key relationships properly designed
- [ ] RLS policies tested for effectiveness
- [ ] Performance impact assessed
- [ ] Rollback procedures validated
- [ ] Documentation updated

### Testing Improvements
- [ ] Automated test coverage increased
- [ ] Performance testing included
- [ ] Security testing enhanced
- [ ] Integration testing expanded
- [ ] User acceptance testing added

### Process Enhancements
- [ ] Pre-deployment checklists implemented
- [ ] Staged deployment process
- [ ] Automated rollback capabilities
- [ ] Enhanced monitoring and alerting
- [ ] Regular security audits
- [ ] Performance benchmarking

---

This guide should be used in conjunction with the comprehensive testing plan to ensure that strategy fixes are properly validated and any issues are quickly identified and resolved.