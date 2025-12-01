# Targeted UI Color Reversion Verification Report

**Generated:** 2025-11-21T20:07:44.130Z
**Application URL:** http://localhost:3000

## Executive Summary

- **Total Checks:** 10
- **Passed:** 3
- **Partial:** 1
- **Failed:** 6
- **Success Rate:** 30%

⚠️ **Several verification checks failed.** The UI color reversion needs attention.

## Detailed Results

### 1. Server Status

**Status:** ✅ PASS

**Details:** Server responded with status 200. Application loaded successfully.

### 2. Sidebar Components

**Status:** ❌ FAIL

**Details:**

### 3. Filter Pills and Interactive Elements

**Status:** ❌ FAIL

**Details:**
- **Filter Control 1:** ❌ Has blue/purple theme
  - Classes: w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-primary rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center group
  - Background: rgba(0, 0, 0, 0) linear-gradient(to right, rgb(30, 64, 175), rgb(29, 78, 216)) repeat scroll 0% 0% / auto padding-box border-box
- **Button 1:** ❌ Has blue/purple theme
  - Classes: w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-primary rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center group
  - Background: rgba(0, 0, 0, 0) linear-gradient(to right, rgb(30, 64, 175), rgb(29, 78, 216)) repeat scroll 0% 0% / auto padding-box border-box

### 4. Chart Containers

**Status:** ❌ FAIL

**Details:**
- **Chart Container 1:** ❌ Has blue/purple borders/theme
  - Classes: balatro-container mouse-interaction
  - Border: rgb(229, 231, 235)
- **Chart Container 2:** ❌ Has blue/purple borders/theme
  - Classes: balatro-container mouse-interaction
  - Border: rgb(229, 231, 235)
- **Chart Container 3:** ❌ Has blue/purple borders/theme
  - Classes: card-unified p-3 text-center
  - Border: rgb(71, 85, 105)

### 5. Scrollbar Styles

**Status:** ❌ ERROR

**Details:**
- **Body Scrollbar:** ❌ Has blue/purple scrollbar styles
  - Classes: inter_5972bc34-module__OU16Qa__className h-full scrollbar-global
  - Scrollbar Color: rgba(30, 58, 138, 0.3) rgba(255, 255, 255, 0.05)
- **undefined:** ❌ Has blue/purple scrollbar styles
  - Classes: N/A

### 6. Button and Form Elements

**Status:** ❌ FAIL

**Details:**
- **Form Element 1:** ❌ Has blue/purple color scheme
  - Classes: metallic-input w-full
  - Background: rgba(0, 0, 0, 0) linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)) repeat scroll 0% 0% / auto padding-box padding-box
- **Form Element 2:** ❌ Has blue/purple color scheme
  - Classes: metallic-input w-full
  - Background: rgba(0, 0, 0, 0) linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)) repeat scroll 0% 0% / auto padding-box padding-box
- **Form Element 3:** ❌ Has blue/purple color scheme
  - Classes: mr-2 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2
  - Background: rgb(55, 65, 81) none repeat scroll 0% 0% / auto padding-box border-box

### 7. Modal Components

**Status:** ❌ FAIL

**Details:**

### 8. Balatro Dark Green Background

**Status:** ⚠️ PARTIAL

**Details:**
- **Balatro Container:** ✅ Has dark green background
  - Classes: balatro-container mouse-interaction
  - Background: rgb(13, 40, 24) none repeat scroll 0% 0% / auto padding-box border-box
- **Balatro Canvas:** ❌ Has dark green background
  - Classes: balatro-canvas
  - Background: rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box

### 9. Visual Harmony and Readability

**Status:** ✅ PASS

**Details:**
- **Text Contrast:** ❌ Good contrast (NaN% of elements)
- **Color Scheme:** ✅ Cohesive blue/purple theme

### 10. Basic Functionality

**Status:** ✅ PASS

**Details:**
- **Navigation Links:** ✅ Working
  - Found: 1 elements
  - Working: 1 links
- **Interactive Elements:** ✅ Working
  - Found: 4 elements
  - Working: 4 elements
- **Console Errors:** ❌ Working

## Screenshots

All verification screenshots have been saved to the `./targeted-ui-verification-screenshots` directory:

- app-loaded-2025-11-21T20-06-35-962Z.png
- balatro-background-2025-11-21T20-07-27-291Z.png
- basic-functionality-2025-11-21T20-07-42-861Z.png
- button-form-elements-2025-11-21T20-07-09-967Z.png
- chart-containers-2025-11-21T20-06-56-504Z.png
- filter-elements-2025-11-21T20-06-50-056Z.png
- modal-components-2025-11-21T20-07-19-422Z.png
- sidebar-components-2025-11-21T20-06-42-910Z.png
- visual-harmony-2025-11-21T20-07-35-006Z.png

## Recommendations

### Priority Issues to Fix

- **Sidebar Components:** Ensure navigation and sidebar elements use blue/purple theme
- **Filter Pills:** Ensure filter pills and interactive elements have blue/purple gradients
- **Chart Containers:** Ensure chart containers have blue/purple borders
- **Button/Form Elements:** Ensure buttons and form elements have blue/purple color schemes
- **Modal Components:** Ensure modal components have blue/purple borders and effects
### Minor Improvements

- Consider enhancing the partially implemented features for better consistency
- Review the elements that only partially meet the blue/purple theme requirements

---

**Report generated by Targeted UI Color Reversion Verification Script**
**Timestamp:** 2025-11-21T20:07:44.130Z
