# Authenticated Filtering and Sorting Test Report

**Generated:** 2025-11-17T22:08:26.184Z  
**Authentication Status:** ALREADY_AUTHENTICATED  
**Total Tests:** 23  
**Passed:** 16  
**Failed:** 7  
**Skipped:** 0  
**Pass Rate:** 69.57%

## Executive Summary

This report details the comprehensive testing of filtering and sorting functionality with a dataset of 200 trades using authenticated access. The tests covered all major filtering and sorting capabilities across the application.

## Authentication Status

✅ **Authentication Successful** - Test user was able to access the application

## Test Results

### Filter Controls Detection
Found 0 filter controls: 

### Sort Controls Detection  
Found 0 sort controls: 

### Basic Functionality Tests

#### Trade Count Verification
- **Status:** PASS
- **Details:** Found 1 trades on page
- **Duration:** 12ms

#### Trade Data Verification
- **Status:** FAIL
- **Details:** Has symbols: false, Has P&L: false
- **Duration:** 30ms


### Manual Filtering Tests

#### Date-Based Filtering
- **Status:** FAIL
- **Details:** Error: locator.count: Unexpected token "Date(" while parsing css selector ".glass:has-text(new Date().toLocaleDateString())". Did you mean to CSS.escape it?
- **Duration:** 2ms


### Sorting Tests



### Performance Tests

#### Performance - Page Load
- **Status:** PASS
- **Details:** Page loaded in 979ms
- **Duration:** 979ms

#### Performance - Scroll
- **Status:** FAIL
- **Details:** Page scrolled in 1014ms
- **Duration:** 1014ms

#### Performance - Data Rendering
- **Status:** PASS
- **Details:** 1 trades rendered in 15ms
- **Duration:** 15ms


### Dashboard Tests

#### Dashboard Stats Cards
- **Status:** PASS
- **Details:** Found 1 stats cards
- **Duration:** 3968ms

#### Dashboard Charts
- **Status:** PASS
- **Details:** Found 1 chart elements
- **Duration:** 3971ms

#### Dashboard P&L Display
- **Status:** FAIL
- **Details:** P&L information not found
- **Duration:** 3974ms

#### Dashboard Win Rate Display
- **Status:** FAIL
- **Details:** Win rate information not found
- **Duration:** 3976ms


## Issues Found

- **Filter Controls Detection:** Found 0 filter controls: 
- **Sort Controls Detection:** Found 0 sort controls: 
- **Trade Data Verification:** Has symbols: false, Has P&L: false
- **Date-Based Filtering:** Error: locator.count: Unexpected token "Date(" while parsing css selector ".glass:has-text(new Date().toLocaleDateString())". Did you mean to CSS.escape it?
- **Performance - Scroll:** Page scrolled in 1014ms
- **Dashboard P&L Display:** P&L information not found
- **Dashboard Win Rate Display:** Win rate information not found

## Recommendations

- Implement comprehensive filtering UI controls for trades page
- Implement comprehensive sorting UI controls for trades page
- Optimize application performance for handling 200+ trades
- Enhance dashboard analytics and filtering capabilities

## Detailed Test Results

```json
[
  {
    "name": "Authentication",
    "status": "PASS",
    "details": "User successfully authenticated",
    "duration": 0,
    "timestamp": "2025-11-17T22:08:30.593Z"
  },
  {
    "name": "Filter Controls Detection",
    "status": "FAIL",
    "details": "Found 0 filter controls: ",
    "duration": 0,
    "timestamp": "2025-11-17T22:08:34.882Z"
  },
  {
    "name": "Sort Controls Detection",
    "status": "FAIL",
    "details": "Found 0 sort controls: ",
    "duration": 0,
    "timestamp": "2025-11-17T22:08:34.883Z"
  },
  {
    "name": "Trade Count Verification",
    "status": "PASS",
    "details": "Found 1 trades on page",
    "duration": 12,
    "timestamp": "2025-11-17T22:08:34.895Z"
  },
  {
    "name": "Trade Data Verification",
    "status": "FAIL",
    "details": "Has symbols: false, Has P&L: false",
    "duration": 30,
    "timestamp": "2025-11-17T22:08:34.913Z"
  },
  {
    "name": "Manual Symbol Filtering - AAPL",
    "status": "PASS",
    "details": "Found 0 AAPL trades via content search",
    "duration": 7,
    "timestamp": "2025-11-17T22:08:34.920Z"
  },
  {
    "name": "Manual Symbol Filtering - BTC",
    "status": "PASS",
    "details": "Found 0 BTC trades via content search",
    "duration": 17,
    "timestamp": "2025-11-17T22:08:34.930Z"
  },
  {
    "name": "Manual Win/Loss Filtering - Profit",
    "status": "PASS",
    "details": "Found 0 profitable trades via green text",
    "duration": 23,
    "timestamp": "2025-11-17T22:08:34.936Z"
  },
  {
    "name": "Manual Market Filtering - Stock",
    "status": "PASS",
    "details": "Found 0 Stock trades via content search",
    "duration": 27,
    "timestamp": "2025-11-17T22:08:34.940Z"
  },
  {
    "name": "Manual Market Filtering - Crypto",
    "status": "PASS",
    "details": "Found 0 Crypto trades via content search",
    "duration": 31,
    "timestamp": "2025-11-17T22:08:34.944Z"
  },
  {
    "name": "Date-Based Filtering",
    "status": "FAIL",
    "details": "Error: locator.count: Unexpected token \"Date(\" while parsing css selector \".glass:has-text(new Date().toLocaleDateString())\". Did you mean to CSS.escape it?",
    "duration": 2,
    "timestamp": "2025-11-17T22:08:34.947Z"
  },
  {
    "name": "Emotional State Filtering - FOMO",
    "status": "PASS",
    "details": "Found 0 FOMO trades",
    "duration": 4,
    "timestamp": "2025-11-17T22:08:34.951Z"
  },
  {
    "name": "Emotional State Filtering - REVENGE",
    "status": "PASS",
    "details": "Found 0 REVENGE trades",
    "duration": 9,
    "timestamp": "2025-11-17T22:08:34.956Z"
  },
  {
    "name": "Emotional State Filtering - CONFIDENT",
    "status": "PASS",
    "details": "Found 0 CONFIDENT trades",
    "duration": 13,
    "timestamp": "2025-11-17T22:08:34.960Z"
  },
  {
    "name": "Emotional State Filtering - PATIENCE",
    "status": "PASS",
    "details": "Found 0 PATIENCE trades",
    "duration": 17,
    "timestamp": "2025-11-17T22:08:34.964Z"
  },
  {
    "name": "Emotional State Filtering - TILT",
    "status": "PASS",
    "details": "Found 0 TILT trades",
    "duration": 21,
    "timestamp": "2025-11-17T22:08:34.968Z"
  },
  {
    "name": "Performance - Page Load",
    "status": "PASS",
    "details": "Page loaded in 979ms",
    "duration": 979,
    "timestamp": "2025-11-17T22:08:35.953Z"
  },
  {
    "name": "Performance - Scroll",
    "status": "FAIL",
    "details": "Page scrolled in 1014ms",
    "duration": 1014,
    "timestamp": "2025-11-17T22:08:36.967Z"
  },
  {
    "name": "Performance - Data Rendering",
    "status": "PASS",
    "details": "1 trades rendered in 15ms",
    "duration": 15,
    "timestamp": "2025-11-17T22:08:36.982Z"
  },
  {
    "name": "Dashboard Stats Cards",
    "status": "PASS",
    "details": "Found 1 stats cards",
    "duration": 3968,
    "timestamp": "2025-11-17T22:08:40.951Z"
  },
  {
    "name": "Dashboard Charts",
    "status": "PASS",
    "details": "Found 1 chart elements",
    "duration": 3971,
    "timestamp": "2025-11-17T22:08:40.954Z"
  },
  {
    "name": "Dashboard P&L Display",
    "status": "FAIL",
    "details": "P&L information not found",
    "duration": 3974,
    "timestamp": "2025-11-17T22:08:40.957Z"
  },
  {
    "name": "Dashboard Win Rate Display",
    "status": "FAIL",
    "details": "Win rate information not found",
    "duration": 3976,
    "timestamp": "2025-11-17T22:08:40.959Z"
  }
]
```

---

*This report was generated automatically by the authenticated filtering and sorting test script.*
