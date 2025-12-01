# API Confluence Filtering Test Report

Generated: 2025-12-01T12:51:38.149Z

## Summary

- **Total Tests:** 29
- **Passed:** 0
- **Failed:** 29
- **Pass Rate:** 0.0%

## Test Results

| Test | Status | Details | Performance |
|------|--------|----------|-------------|
| Authentication | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Strategies API | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Trades API - basic request | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Emotion filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Symbol filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Market filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - P&L filter - profitable | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - P&L filter - lossable | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Side filter - Buy | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Side filter - Sell | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Date from filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Single filter - Date to filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Filter combination - Emotion + Market | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Filter combination - Symbol + Side | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Filter combination - P&L + Date range | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Filter combination - All filters | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Empty emotion filter | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Invalid market | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Future date | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Negative page | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Zero limit | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Large limit | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Multiple emotions | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Edge case - Special characters in symbol | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Stats API | ❌ FAIL | write EPROTO 30290000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:355:
 | -
| Performance - No filters | ❌ FAIL | Avg: 9999ms, Min: 9999ms, Max: 9999ms | 9999ms
| Performance - Single filter | ❌ FAIL | Avg: 9999ms, Min: 9999ms, Max: 9999ms | 9999ms
| Performance - Multiple filters | ❌ FAIL | Avg: 9999ms, Min: 9999ms, Max: 9999ms | 9999ms
| Performance - Complex filters | ❌ FAIL | Avg: 9999ms, Min: 9999ms, Max: 9999ms | 9999ms

## Performance Analysis

| Test | Response Time | Min | Max | Samples |
|------|---------------|------|------|---------|
| Performance - No filters | 9999ms | 9999ms | 9999ms | 3
| Performance - Single filter | 9999ms | 9999ms | 9999ms | 3
| Performance - Multiple filters | 9999ms | 9999ms | 9999ms | 3
| Performance - Complex filters | 9999ms | 9999ms | 9999ms | 3

## API Endpoints Tested



## Recommendations

- Consider optimizing API response times - average is 9999ms
- 1 Authentication test(s) failed - review Authentication implementation
- 1 Strategies API test(s) failed - review Strategies API implementation
- 1 Trades API test(s) failed - review Trades API implementation
- 9 Single filter test(s) failed - review Single filter implementation
- 4 Filter combination test(s) failed - review Filter combination implementation
- 8 Edge case test(s) failed - review Edge case implementation
- 1 Stats API test(s) failed - review Stats API implementation
- 4 Performance test(s) failed - review Performance implementation
- 4 slow API responses detected (>2s) - consider database query optimization

---
*Report generated by API Confluence Filtering Test Suite*
