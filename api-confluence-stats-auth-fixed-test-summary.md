# API Confluence Stats Auth-Fixed Test Report

**Generated:** 2025-12-09T20:00:59.062Z

## Summary

- **Total Tests:** 28
- **Passed:** 26 ✅
- **Failed:** 2 ❌
- **Success Rate:** 92.9%
- **Total Duration:** 10569ms

## Environment

- **API URL:** http://localhost:3000
- **Endpoint:** /api/confluence-stats
- **Node Version:** v22.14.0
- **Platform:** win32
- **Has Supabase:** true
- **Has Auth Token:** true

## Test Results

### Authentication & Authorization

- ✅ **No Authentication** - {"status":401,"hasAuthError":true}
- ✅ **Mock Token Authentication** - {"status":401,"handlesGracefully":true}
- ❌ **Real Authentication** - {"note":"Real authentication not available - using mock"}

### Data Input Validation

- ✅ **API Structure Validation** - {"status":200,"hasErrorStructure":false,"hasRequestId":true}
- ✅ **Parameter Parsing** - {"status":200,"handlesParameters":true}
- ✅ **Malformed Parameters** - {"status":200,"handlesMalformed":true}
- ✅ **Extreme Parameter Values** - {"status":200,"handlesExtremeValues":true}
- ✅ **Empty Parameters** - {"status":200,"handlesEmptyParams":true}

### API Logic

- ✅ **API Structure Validation** - {"status":200,"hasErrorStructure":false,"hasRequestId":true}
- ✅ **Response Structure** - {"status":200,"hasError":false,"hasDataStructure":true}

### Performance & Load

- ✅ **Response Structure** - {"status":200,"hasError":false,"hasDataStructure":true}
- ✅ **Response Headers** - {"status":200,"contentType":"application/json"}
- ✅ **Response Time Measurement** - {"responseTime":315,"status":200}
- ✅ **Concurrent Requests** - {"concurrentRequests":5,"successfulConcurrent":5,"averageTime":123.2}
- ✅ **Response Size Analysis** - {"responseSizeBytes":1480}

### Edge Cases & Errors

- ❌ **Error Handling** - {"status":500,"hasGracefulError":false,"hasErrorMessage":true}

### Security

- ✅ **SQL Injection Prevention: '; DROP TABLE trades...** - {"status":200,"preventsSQLInjection":true}
- ✅ **SQL Injection Prevention: 1' OR '1'='1...** - {"status":200,"preventsSQLInjection":true}
- ✅ **SQL Injection Prevention: UNION SELECT * FROM ...** - {"status":200,"preventsSQLInjection":true}
- ✅ **XSS Prevention: <script>alert("xss")...** - {"status":200,"preventsXSS":true}
- ✅ **XSS Prevention: javascript:alert("xs...** - {"status":200,"preventsXSS":true}
- ✅ **XSS Prevention: <img src=x onerror=a...** - {"status":200,"preventsXSS":true}

## Recommendations

- Address failed tests to improve API reliability
- Review authentication implementation and test user setup

## Key Findings

- **Authentication:** 2/3 tests passed
- **Performance:** 5/5 tests passed
- **Security:** 6/6 tests passed
