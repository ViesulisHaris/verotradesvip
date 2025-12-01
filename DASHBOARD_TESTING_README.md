# Dashboard Comprehensive Testing Script

This document provides instructions for using the comprehensive dashboard testing script that validates all specifications of the VeroTrades dashboard.

## Overview

The `dashboard-comprehensive-test.js` script is a comprehensive browser-based testing solution using Puppeteer that validates:

- **Layout & Structure** - Top navigation height, dashboard title size, grid layouts, border radius
- **Color Scheme** - Primary background, card surfaces, accent colors (dusty gold, warm sand, muted olive, rust red)
- **Hover States** - Background lightening, text brightening, smooth transitions, box shadows
- **Responsive Design** - Mobile (<768px), Tablet (768px-1024px), Desktop (>1024px) adaptations
- **Accessibility** - WCAG compliance, contrast ratios, keyboard navigation, ARIA labels
- **Component Functionality** - Key metric cards, performance sections, charts, navigation, data integration

## Prerequisites

1. **Development Server Running**: Make sure your Next.js development server is running:
   ```bash
   npm run dev
   ```

2. **Authentication**: The dashboard requires authentication. Ensure you're logged in or the test will be redirected to the login page.

3. **Dependencies**: Puppeteer is already included in the project dependencies.

## Quick Start

### Method 1: Using npm script (Recommended)
```bash
npm run test:dashboard
```

### Method 2: Direct execution
```bash
node dashboard-comprehensive-test.js
```

## Test Configuration

The script is configured with the following settings (can be modified in `TEST_CONFIG`):

```javascript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  dashboardUrl: 'http://localhost:3000/dashboard',
  screenshotsDir: './dashboard-test-screenshots',
  reportFile: './dashboard-comprehensive-test-report.json',
  headless: false,  // Set to true for headless testing
  slowMo: 100,      // Slow down actions for better observation
  viewportWidth: 1920,
  viewportHeight: 1080
};
```

## Color Specifications Validated

The script validates these exact color hex values:

- **Primary Background**: `#121212`
- **Card Surface**: `#202020`
- **Dusty Gold**: `#B89B5E`
- **Warm Sand**: `#D6C7B2`
- **Muted Olive**: `#4F5B4A`
- **Rust Red**: `#A7352D`
- **Primary Text**: `#EAE6DD`
- **Secondary Text**: `#9A9A9A`

## Layout Specifications Validated

- **Top Navigation Height**: 60px
- **Dashboard Title Size**: 32px
- **Grid Gaps**: 16px
- **Border Radius**: 12px

## Responsive Breakpoints Tested

1. **Mobile**: 375x667 (stacked layouts, 10% larger fonts)
2. **Tablet**: 768x1024 (adaptive grids)
3. **Laptop**: 1024x768 (transitional layout)
4. **Desktop**: 1920x1080 (full layouts)

## Test Categories

### 1. Layout and Structure Tests
- Top navigation height validation
- Dashboard title font size
- Grid gap spacing
- Card border radius
- Component hierarchy and structure

### 2. Color Scheme Tests
- Primary background color
- Card surface colors
- Primary and secondary text colors
- Accent color presence (dusty gold, warm sand, muted olive, rust red)

### 3. Hover States Tests
- Card hover effects (background, transform, shadow changes)
- Button hover effects
- Transition smoothness and duration

### 4. Responsive Design Tests
- Layout adaptation across all breakpoints
- Font size adjustments
- Navigation element visibility
- Grid column changes

### 5. Accessibility Tests
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Color contrast ratios (WCAG AA compliance)

### 6. Component Functionality Tests
- Key metric cards data display
- Performance sections rendering
- Chart components
- Navigation functionality
- Data integration and loading states

## Output Files

### 1. Test Report
- **File**: `dashboard-comprehensive-test-report.json`
- **Format**: JSON with detailed test results, screenshots, and recommendations
- **Content**:
  ```json
  {
    "timestamp": "2025-11-22T14:52:37.691Z",
    "summary": {
      "totalTests": 25,
      "passedTests": 20,
      "failedTests": 3,
      "warnings": 2
    },
    "categories": {
      "layout": { "tests": [...], "passed": 4, "failed": 1, "warnings": 0 },
      "colors": { "tests": [...], "passed": 3, "failed": 1, "warnings": 1 },
      // ... other categories
    },
    "screenshots": [...],
    "recommendations": [...]
  }
  ```

### 2. Screenshots
- **Directory**: `./dashboard-test-screenshots/`
- **Naming**: `{description}-{breakpoint}-{timestamp}.png`
- **Examples**:
  - `layout-structure-test-desktop-2025-11-22T14-52-37-691Z.png`
  - `responsive-mobile-mobile-2025-11-22T14-52-37-691Z.png`
  - `color-scheme-test-desktop-2025-11-22T14-52-37-691Z.png`

## Running Tests in Different Modes

### Headless Mode (for CI/CD)
Modify the script configuration or run with environment variable:
```bash
# Set headless mode
node -e "require('./dashboard-comprehensive-test.js').TEST_CONFIG.headless = true; require('./dashboard-comprehensive-test.js')"
```

### Custom Viewport Testing
You can modify the viewport sizes in the `BREAKPOINTS` configuration:
```javascript
const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  // Add custom breakpoints
  ultrawide: { width: 3440, height: 1440, name: 'Ultra Wide' }
};
```

## Understanding Test Results

### Test Status Categories
- **✅ Passed**: Test meets specifications exactly
- **⚠️ Warnings**: Test mostly passes but has minor deviations
- **❌ Failed**: Test does not meet specifications

### Common Issues and Solutions

#### Color Validation Failures
- **Issue**: Colors don't match exact hex values
- **Solution**: Check CSS files for exact color definitions
- **Files to check**: 
  - `src/app/globals.css`
  - Component-specific CSS files

#### Layout Validation Failures
- **Issue**: Dimensions don't match specifications
- **Solution**: Verify Tailwind classes and inline styles
- **Check**: Component files for hardcoded dimensions

#### Responsive Test Failures
- **Issue**: Layout doesn't adapt properly
- **Solution**: Review responsive breakpoints in Tailwind configuration
- **Check**: `tailwind.config.js` and component responsive classes

#### Accessibility Test Failures
- **Issue**: Missing ARIA labels or semantic HTML
- **Solution**: Add proper ARIA attributes and semantic elements
- **Check**: Component JSX for accessibility attributes

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Dashboard Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: sleep 10
      - run: npm run test:dashboard
      - uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: |
            dashboard-comprehensive-test-report.json
            dashboard-test-screenshots/
```

## Troubleshooting

### Common Issues

1. **Test fails with navigation to login page**
   - Ensure you're authenticated before running tests
   - Check if the dashboard requires authentication

2. **Screenshots appear blank**
   - Increase wait times in the script
   - Check if the development server is running properly

3. **Color validation fails**
   - Verify the exact hex values in your CSS
   - Check for CSS overrides or dynamic color changes

4. **Responsive tests fail**
   - Ensure all responsive breakpoints are properly configured
   - Check for CSS media queries that might interfere

### Debug Mode

To run tests with more debugging information:
1. Set `headless: false` in the configuration
2. Increase `slowMo` value for slower execution
3. Add console.log statements in the test functions

## Customization

### Adding New Tests

To add new test categories or specific tests:

1. Create a new test function following the existing pattern
2. Add it to the main test execution flow
3. Update the test results structure

Example:
```javascript
async function testCustomFeature(page) {
  console.log('\n🔧 Testing Custom Feature...');
  const tests = [];
  
  // Add your test logic here
  
  testResults.categories.customFeature.tests = tests;
  await takeScreenshot(page, 'custom-feature-test');
}
```

### Modifying Specifications

To update the specifications being validated:

1. Modify the `COLOR_SPECIFICATIONS` object for color tests
2. Update `LAYOUT_SPECIFICATIONS` for layout tests
3. Adjust `BREAKPOINTS` for responsive testing

## Support

For issues or questions about the dashboard testing script:

1. Check the test report JSON for detailed error information
2. Review the screenshots to visualize any issues
3. Verify your development environment matches the test expectations
4. Ensure all dependencies are properly installed

## Version History

- **v1.0**: Initial comprehensive testing script with full specification validation
- Supports all major dashboard components and responsive breakpoints
- Includes accessibility and functionality testing