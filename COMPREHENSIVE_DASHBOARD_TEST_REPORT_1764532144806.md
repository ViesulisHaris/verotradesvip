# Comprehensive Dashboard Test Report

**Generated:** 30/11/2025, 21:49:04

## Test Summary

- **Total Tests:** 9
- **Passed:** ✅ 2
- **Failed:** ❌ 4
- **Warnings:** ⚠️ 3

## Detailed Test Results

### ✅ Page Loading and Rendering

**Status:** PASSED

**Details:**
```json
{
  "loadTime": "1144ms",
  "pageTitle": "",
  "pageUrl": "http://localhost:3000/dashboard",
  "elementsFound": {
    "body": true,
    "main": true,
    "container": true
  },
  "timestamp": "2025-11-30T19:49:01.422Z"
}
```

### ⚠️ Authentication Requirements

**Status:** WARNING

**Details:**
```json
{
  "message": "Unable to determine authentication state",
  "authState": {
    "hasLoginForm": false,
    "hasRegisterForm": false,
    "hasDashboardContent": false,
    "hasUserMenu": false,
    "bodyClasses": "h-full"
  },
  "timestamp": "2025-11-30T19:49:01.571Z"
}
```

### ⚠️ Trading Statistics Display

**Status:** WARNING

**Details:**
```json
{
  "statistics": {
    "metrics": {},
    "containers": {
      "statsGrid": null,
      "statsCards": 0,
      "statsContainer": null
    }
  },
  "hasValidMetrics": false,
  "metricsCount": 0,
  "timestamp": "2025-11-30T19:49:01.697Z"
}
```

### ⚠️ Emotional Analysis Components

**Status:** WARNING

**Details:**
```json
{
  "components": {
    "radar": {
      "canvas": null,
      "radarChart": null,
      "emotionContainer": null
    },
    "displays": {
      "currentEmotion": null,
      "emotionHistory": null,
      "emotionTags": 0
    },
    "data": {
      "hasEmotionFields": false,
      "emotionInputs": 0
    }
  },
  "radarWorking": false,
  "timestamp": "2025-11-30T19:49:01.815Z"
}
```

### ❌ Data Fetching from Supabase

**Status:** FAILED

**Details:**
```json
{
  "error": "this.page.waitForTimeout is not a function",
  "timestamp": "2025-11-30T19:49:01.932Z"
}
```

### ✅ Error Handling and Loading States

**Status:** PASSED

**Details:**
```json
{
  "errorHandling": {
    "elements": {
      "errorBoundaries": 0,
      "errorMessages": 0,
      "loadingStates": 0,
      "emptyStates": 0
    },
    "hasErrorHandling": false,
    "totalErrorElements": 0
  },
  "invalidRouteHandled": true,
  "timestamp": "2025-11-30T19:49:04.318Z"
}
```

### ❌ Navigation and Quick Actions

**Status:** FAILED

**Details:**
```json
{
  "error": "Cannot read properties of undefined (reading 'elements')",
  "timestamp": "2025-11-30T19:49:04.779Z"
}
```

### ❌ Browser Console Errors

**Status:** FAILED

**Details:**
```json
{
  "totalMessages": 300,
  "errors": 50,
  "warnings": 0,
  "logs": 247,
  "errorCategories": {
    "javascript": [],
    "network": [],
    "supabase": [],
    "other": [
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.961Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.961Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.967Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.967Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.971Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:00.972Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: the server responded with a status of 404 (Not Found)",
        "timestamp": "2025-11-30T19:49:00.989Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:01.001Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:01.001Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:01.001Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:01.002Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: the server responded with a status of 404 (Not Found)",
        "timestamp": "2025-11-30T19:49:02.379Z"
      },
      {
        "type": "error",
        "text": "Warning: Text content did not match. Server: \"%s\" Client: \"%s\"%s Unknown http://localhost:3000/invalid-route \n    at div\n    at div\n    at div\n    at notFound (webpack-internal:///(app-pages-browser)/./src/app/not-found.tsx:16:53)\n    at ClientPageRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/client-page.js:14:11)\n    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)\n    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)\n    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)\n    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)\n    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)\n    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)\n    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)\n    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)\n    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)\n    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)\n    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)\n    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)\n    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)\n    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)\n    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)\n    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)\n    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)\n    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)\n    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)\n    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)\n    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)\n    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)\n    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./src/components/ErrorBoundary.tsx:94:9)\n    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./src/components/ErrorBoundary.tsx:94:9)\n    at ErrorBoundaryWrapper (webpack-internal:///(app-pages-browser)/./src/components/ErrorBoundaryWrapper.tsx:13:11)\n    at AuthContextProviderDiagnostic (webpack-internal:///(app-pages-browser)/./src/contexts/AuthContext-diagnostic.tsx:35:11)\n    at body\n    at html\n    at RootLayout (Server)\n    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)\n    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)\n    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)\n    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)\n    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)\n    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)\n    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)\n    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)\n    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)\n    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)\n    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)\n    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)\n    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11)",
        "timestamp": "2025-11-30T19:49:02.749Z"
      },
      {
        "type": "error",
        "text": "🔍 [HYDRATION_DEBUG] ErrorBoundary.getDerivedStateFromError JSHandle@object",
        "timestamp": "2025-11-30T19:49:02.752Z"
      },
      {
        "type": "error",
        "text": "🔍 [HYDRATION_DEBUG] ErrorBoundary.getDerivedStateFromError JSHandle@object",
        "timestamp": "2025-11-30T19:49:02.752Z"
      },
      {
        "type": "error",
        "text": "🔍 [HYDRATION_DEBUG] ErrorBoundary.getDerivedStateFromError JSHandle@object",
        "timestamp": "2025-11-30T19:49:02.753Z"
      },
      {
        "type": "error",
        "text": "🔍 [HYDRATION_DEBUG] ErrorBoundary.getDerivedStateFromError JSHandle@object",
        "timestamp": "2025-11-30T19:49:02.753Z"
      },
      {
        "type": "error",
        "text": "Warning: An error occurred during hydration. The server HTML was replaced with client content in <%s>. #document",
        "timestamp": "2025-11-30T19:49:02.755Z"
      },
      {
        "type": "error",
        "text": "Page Error: Text content does not match server-rendered HTML.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.765Z"
      },
      {
        "type": "error",
        "text": "Page Error: Text content does not match server-rendered HTML.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.765Z"
      },
      {
        "type": "error",
        "text": "Page Error: Text content does not match server-rendered HTML.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Text content does not match server-rendered HTML.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Hydration failed because the initial UI does not match what was rendered on the server.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Hydration failed because the initial UI does not match what was rendered on the server.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Hydration failed because the initial UI does not match what was rendered on the server.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Hydration failed because the initial UI does not match what was rendered on the server.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: Hydration failed because the initial UI does not match what was rendered on the server.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.766Z"
      },
      {
        "type": "error",
        "text": "Page Error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error",
        "timestamp": "2025-11-30T19:49:02.767Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.890Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.890Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.893Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.894Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.896Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.897Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.918Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.919Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.919Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:03.920Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.331Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.331Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.342Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.343Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.343Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.344Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.351Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.352Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.356Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.356Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.357Z"
      },
      {
        "type": "error",
        "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
        "timestamp": "2025-11-30T19:49:04.357Z"
      }
    ]
  },
  "recentErrors": [
    {
      "type": "error",
      "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
      "timestamp": "2025-11-30T19:49:04.352Z"
    },
    {
      "type": "error",
      "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
      "timestamp": "2025-11-30T19:49:04.356Z"
    },
    {
      "type": "error",
      "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
      "timestamp": "2025-11-30T19:49:04.356Z"
    },
    {
      "type": "error",
      "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
      "timestamp": "2025-11-30T19:49:04.357Z"
    },
    {
      "type": "error",
      "text": "🚨 AuthContext is undefined - providing safe fallback to prevent gray screen",
      "timestamp": "2025-11-30T19:49:04.357Z"
    }
  ],
  "recentWarnings": [],
  "timestamp": "2025-11-30T19:49:04.780Z"
}
```

### ❌ Responsive Design

**Status:** FAILED

**Details:**
```json
{
  "error": "this.page.waitForTimeout is not a function",
  "timestamp": "2025-11-30T19:49:04.781Z"
}
```

## Screenshots

- **page-load:** Dashboard page loaded (dashboard-test-page-load-2025-11-30T19-49-01-422Z.png)
- **auth-test:** Authentication state check (dashboard-test-auth-test-2025-11-30T19-49-01-571Z.png)
- **trading-stats:** Trading statistics display (dashboard-test-trading-stats-2025-11-30T19-49-01-697Z.png)
- **emotional-analysis:** Emotional analysis components (dashboard-test-emotional-analysis-2025-11-30T19-49-01-815Z.png)
- **error-handling:** Error handling mechanisms (dashboard-test-error-handling-2025-11-30T19-49-04-318Z.png)
