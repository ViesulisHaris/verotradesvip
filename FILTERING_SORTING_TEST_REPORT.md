# Comprehensive Filtering and Sorting Test Report

**Generated:** 2025-11-17T22:04:18.799Z  
**Total Tests:** 19  
**Passed:** 2  
**Failed:** 17  
**Skipped:** 0  
**Pass Rate:** 10.53%

## Executive Summary

This report details the comprehensive testing of filtering and sorting functionality with a dataset of 200 trades. The tests covered all major filtering and sorting capabilities across the application.

## Test Results

### Filter Controls Detection
Found 0 filter controls: 

### Sort Controls Detection  
Found 0 sort controls: 

### Filtering Tests

#### Market Type Filtering
- **Status:** FAIL
- **Details:** Market filter control not found
- **Duration:** 3ms

#### Symbol Filtering
- **Status:** FAIL
- **Details:** Symbol filter control not found
- **Duration:** 4ms

#### Date Range Filtering
- **Status:** FAIL
- **Details:** Date filter controls not found
- **Duration:** 3ms

#### Win/Loss Filtering
- **Status:** FAIL
- **Details:** Win/Loss filter control not found
- **Duration:** 3ms

#### Emotional State Filtering
- **Status:** FAIL
- **Details:** Emotional state filter control not found
- **Duration:** 4ms

#### Combined Filtering
- **Status:** FAIL
- **Details:** Not enough filter controls available for combined testing
- **Duration:** 4ms

#### Dashboard Filtering
- **Status:** FAIL
- **Details:** Error: page.goto: Target page, context or browser has been closed
- **Duration:** 0ms


### Sorting Tests

#### Sorting by Date
- **Status:** FAIL
- **Details:** Date sort control not found
- **Duration:** 6ms

#### Sorting by P&L
- **Status:** FAIL
- **Details:** P&L sort control not found
- **Duration:** 8ms

#### Sorting by Symbol
- **Status:** FAIL
- **Details:** Symbol sort control not found
- **Duration:** 9ms


### Performance Tests

#### Performance - Page Load
- **Status:** PASS
- **Details:** Completed in 1289ms
- **Duration:** 1289ms

#### Performance - Market Filter
- **Status:** FAIL
- **Details:** Error: locator.selectOption: Target page, context or browser has been closed
Call log:
[2m  - waiting for locator('select[name="market"]').first()[22m

- **Duration:** 0ms

#### Performance - Symbol Filter
- **Status:** FAIL
- **Details:** Error: locator.fill: Target page, context or browser has been closed
- **Duration:** 0ms

#### Performance - Date Filter
- **Status:** FAIL
- **Details:** Error: locator.fill: Target page, context or browser has been closed
- **Duration:** 0ms

#### Performance - Sort by Date
- **Status:** FAIL
- **Details:** Error: locator.selectOption: Target page, context or browser has been closed
- **Duration:** 0ms

#### Performance - Sort by P&L
- **Status:** FAIL
- **Details:** Error: locator.selectOption: Target page, context or browser has been closed
- **Duration:** 0ms


## Performance Analysis

- **Average Filter Time:** 0.00ms
- **Average Sort Time:** 0.00ms
- **Filter Operations:** 0
- **Sort Operations:** 0

## Issues Found

- **Filter Controls Detection:** Found 0 filter controls: 
- **Sort Controls Detection:** Found 0 sort controls: 
- **Market Type Filtering:** Market filter control not found
- **Symbol Filtering:** Symbol filter control not found
- **Date Range Filtering:** Date filter controls not found
- **Win/Loss Filtering:** Win/Loss filter control not found
- **Emotional State Filtering:** Emotional state filter control not found
- **Combined Filtering:** Not enough filter controls available for combined testing
- **Sorting by Date:** Date sort control not found
- **Sorting by P&L:** P&L sort control not found
- **Sorting by Symbol:** Symbol sort control not found
- **Performance - Market Filter:** Error: locator.selectOption: Target page, context or browser has been closed
Call log:
[2m  - waiting for locator('select[name="market"]').first()[22m

- **Performance - Symbol Filter:** Error: locator.fill: Target page, context or browser has been closed
- **Performance - Date Filter:** Error: locator.fill: Target page, context or browser has been closed
- **Performance - Sort by Date:** Error: locator.selectOption: Target page, context or browser has been closed
- **Performance - Sort by P&L:** Error: locator.selectOption: Target page, context or browser has been closed
- **Dashboard Filtering:** Error: page.goto: Target page, context or browser has been closed

## Recommendations

- Implement missing filtering and sorting controls based on test failures
- Implement comprehensive filtering functionality across all trade attributes
- Implement comprehensive sorting functionality for all trade columns

## Detailed Test Results

```json
[
  {
    "name": "Filter Controls Detection",
    "status": "FAIL",
    "details": "Found 0 filter controls: ",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:24.366Z"
  },
  {
    "name": "Sort Controls Detection",
    "status": "FAIL",
    "details": "Found 0 sort controls: ",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:24.366Z"
  },
  {
    "name": "Initial Trade Count",
    "status": "PASS",
    "details": "Found 1 trades on page",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:24.371Z"
  },
  {
    "name": "Market Type Filtering",
    "status": "FAIL",
    "details": "Market filter control not found",
    "duration": 3,
    "timestamp": "2025-11-17T22:04:24.376Z"
  },
  {
    "name": "Symbol Filtering",
    "status": "FAIL",
    "details": "Symbol filter control not found",
    "duration": 4,
    "timestamp": "2025-11-17T22:04:24.380Z"
  },
  {
    "name": "Date Range Filtering",
    "status": "FAIL",
    "details": "Date filter controls not found",
    "duration": 3,
    "timestamp": "2025-11-17T22:04:24.384Z"
  },
  {
    "name": "Win/Loss Filtering",
    "status": "FAIL",
    "details": "Win/Loss filter control not found",
    "duration": 3,
    "timestamp": "2025-11-17T22:04:24.388Z"
  },
  {
    "name": "Emotional State Filtering",
    "status": "FAIL",
    "details": "Emotional state filter control not found",
    "duration": 4,
    "timestamp": "2025-11-17T22:04:24.392Z"
  },
  {
    "name": "Combined Filtering",
    "status": "FAIL",
    "details": "Not enough filter controls available for combined testing",
    "duration": 4,
    "timestamp": "2025-11-17T22:04:24.396Z"
  },
  {
    "name": "Sorting by Date",
    "status": "FAIL",
    "details": "Date sort control not found",
    "duration": 6,
    "timestamp": "2025-11-17T22:04:24.403Z"
  },
  {
    "name": "Sorting by P&L",
    "status": "FAIL",
    "details": "P&L sort control not found",
    "duration": 8,
    "timestamp": "2025-11-17T22:04:24.411Z"
  },
  {
    "name": "Sorting by Symbol",
    "status": "FAIL",
    "details": "Symbol sort control not found",
    "duration": 9,
    "timestamp": "2025-11-17T22:04:24.421Z"
  },
  {
    "name": "Performance - Page Load",
    "status": "PASS",
    "details": "Completed in 1289ms",
    "duration": 1289,
    "timestamp": "2025-11-17T22:04:25.710Z"
  },
  {
    "name": "Performance - Market Filter",
    "status": "FAIL",
    "details": "Error: locator.selectOption: Target page, context or browser has been closed\nCall log:\n\u001b[2m  - waiting for locator('select[name=\"market\"]').first()\u001b[22m\n",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.941Z"
  },
  {
    "name": "Performance - Symbol Filter",
    "status": "FAIL",
    "details": "Error: locator.fill: Target page, context or browser has been closed",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.942Z"
  },
  {
    "name": "Performance - Date Filter",
    "status": "FAIL",
    "details": "Error: locator.fill: Target page, context or browser has been closed",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.942Z"
  },
  {
    "name": "Performance - Sort by Date",
    "status": "FAIL",
    "details": "Error: locator.selectOption: Target page, context or browser has been closed",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.943Z"
  },
  {
    "name": "Performance - Sort by P&L",
    "status": "FAIL",
    "details": "Error: locator.selectOption: Target page, context or browser has been closed",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.943Z"
  },
  {
    "name": "Dashboard Filtering",
    "status": "FAIL",
    "details": "Error: page.goto: Target page, context or browser has been closed",
    "duration": 0,
    "timestamp": "2025-11-17T22:04:44.944Z"
  }
]
```

---

*This report was generated automatically by the comprehensive filtering and sorting test script.*
