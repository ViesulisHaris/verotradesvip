# API Confluence Stats Test Report

**Generated:** 2025-12-09T19:59:27.061Z

## Summary

- **Total Tests:** 26
- **Passed:** 7 ✅
- **Failed:** 19 ❌
- **Success Rate:** 26.9%
- **Total Duration:** 6076ms

## Test Results

### Authentication & Authorization

- ✅ **No Authentication** - {"status":401,"hasAuthError":true}
- ❌ **Valid Authentication** - {"status":401,"hasData":true}

### Data Input Validation

- ❌ **Valid Emotional States** - {"status":401,"hasEmotionalData":false}
- ❌ **Invalid Emotional States** - {"status":401,"handlesInvalidGracefully":true}
- ❌ **Empty Emotional States** - {"status":401,"handlesEmptyStates":true}
- ❌ **Emotional States Filter** - {"status":401,"hasFilteredData":true}

### Psychological Metrics

- ❌ **Psychological Metrics Available** - {"status":401}

### Filtering & Parameters

- ❌ **Emotional States Filter** - {"status":401,"hasFilteredData":true}
- ❌ **Date Range Filter** - {"status":401,"handlesDateRange":true}
- ❌ **Symbol Filter** - {"status":401,"handlesSymbolFilter":true}
- ❌ **Market Filter** - {"status":401,"handlesMarketFilter":true}
- ❌ **P&L Filter (Profitable)** - {"status":401,"handlesPnlFilter":true}
- ❌ **P&L Filter (Lossable)** - {"status":401,"handlesPnlFilter":true}
- ❌ **Side Filter (Buy)** - {"status":401,"handlesSideFilter":true}
- ❌ **Side Filter (Sell)** - {"status":401,"handlesSideFilter":true}
- ❌ **Combined Filters** - {"status":401,"handlesCombinedFilters":true}

### Performance & Load

- ✅ **Response Time < 500ms** - {"responseTime":135,"status":401}
- ❌ **Concurrent Requests** - {"concurrentRequests":10,"successfulConcurrent":0,"averageTime":51.3}
- ✅ **Response Size Reasonable** - {"responseSizeBytes":167}

### Error Handling

- ❌ **Extreme Values Handling** - {"status":401,"hasPsychologicalMetrics":false,"metricsInRange":false}
- ❌ **Large Dataset Handling** - {"status":401,"responseTime":129}
- ✅ **Request Timeout Handling** - {"completedInTime":true}
- ❌ **Invalid JSON Handling** - {"status":0}

## Recommendations

- Address failed tests to improve API reliability
- Consider optimizing API response times
- Review authentication implementation

## Environment

- **API URL:** http://localhost:3000
- **Endpoint:** /api/confluence-stats
- **Node Version:** v22.14.0
- **Platform:** win32
