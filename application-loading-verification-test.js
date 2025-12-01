const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * Application Loading and React Component Verification Test
 * 
 * This script tests:
 * 1. Application loads correctly at http://localhost:3000
 * 2. React components mount properly without errors
 * 3. Main pages (home, dashboard) are accessible
 * 4. No JavaScript errors in browser console
 * 5. Authentication flow is working (login/register pages)
 */

class ApplicationLoadingTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            applicationLoading: {},
            componentMounting: {},
            pageAccessibility: {},
            consoleErrors: {},
            authenticationFlow: {},
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            }
        };
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing browser for application loading test...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to false for visual debugging
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        
        // Capture console logs and errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser Console Error:', msg.text());
                this.testResults.consoleErrors.errors = this.testResults.consoleErrors.errors || [];
                this.testResults.consoleErrors.errors.push({
                    type: 'console',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.page.on('pageerror', error => {
            console.log('Page Error:', error.message);
            this.testResults.consoleErrors.pageErrors = this.testResults.consoleErrors.pageErrors || [];
            this.testResults.consoleErrors.pageErrors.push({
                type: 'pageerror',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Set request timeout
        this.page.setDefaultTimeout(30000);
    }

    async takeScreenshot(name, description) {
        try {
            const timestamp = Date.now();
            const filename = `application-test-${name}-${timestamp}.png`;
            const screenshotPath = `./${filename}`;
            
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            
            this.screenshots.push({
                name,
                description,
                filename,
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📸 Screenshot saved: ${filename}`);
            return screenshotPath;
        } catch (error) {
            console.error(`Failed to take screenshot ${name}:`, error);
            return null;
        }
    }

    async testApplicationLoading() {
        console.log('🔍 Testing application loading at http://localhost:3000...');
        
        try {
            const startTime = Date.now();
            
            // Navigate to the application
            const response = await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            const loadTime = Date.now() - startTime;
            const statusCode = response.status();
            
            // Take screenshot of initial load
            await this.takeScreenshot('initial-load', 'Application initial loading state');
            
            // Check if page loaded successfully
            const loadedSuccessfully = statusCode === 200 && response.ok();
            
            // Check if React app is mounted
            const reactAppMounted = await this.page.evaluate(() => {
                const root = document.getElementById('__next');
                return root && root.children.length > 0;
            });
            
            // Check for critical elements
            const hasBodyContent = await this.page.evaluate(() => {
                return document.body && document.body.children.length > 0;
            });
            
            this.testResults.applicationLoading = {
                statusCode,
                loadTime,
                loadedSuccessfully,
                reactAppMounted,
                hasBodyContent,
                url: this.page.url(),
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Application loading test completed in ${loadTime}ms`);
            console.log(`   Status: ${statusCode}, React Mounted: ${reactAppMounted}`);
            
            return loadedSuccessfully;
            
        } catch (error) {
            console.error('❌ Application loading test failed:', error);
            this.testResults.applicationLoading.error = error.message;
            return false;
        }
    }

    async testComponentMounting() {
        console.log('🔍 Testing React component mounting...');
        
        try {
            // Wait for React components to fully mount
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for React DevTools presence (indicates React is running)
            const reactDevToolsPresent = await this.page.evaluate(() => {
                return !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            });
            
            // Check for hydrated React components
            const componentCount = await this.page.evaluate(() => {
                const allElements = document.querySelectorAll('*');
                let reactComponents = 0;
                
                for (let element of allElements) {
                    if (element._reactInternalFiber || element.__reactInternalInstance) {
                        reactComponents++;
                    }
                }
                
                return reactComponents;
            });
            
            // Check for common React component patterns
            const hasReactComponents = await this.page.evaluate(() => {
                const selectors = [
                    '[data-reactroot]',
                    '[data-reactid]',
                    '.react-component',
                    '[class*="css-"]', // Styled components
                    '[class*="Mui-"]'  // Material-UI components
                ];
                
                return selectors.some(selector => document.querySelector(selector));
            });
            
            // Take screenshot after components should be mounted
            await this.takeScreenshot('components-mounted', 'React components mounted state');
            
            this.testResults.componentMounting = {
                reactDevToolsPresent,
                componentCount,
                hasReactComponents,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Component mounting test completed`);
            console.log(`   React DevTools: ${reactDevToolsPresent}, Components: ${componentCount}`);
            
            return hasReactComponents;
            
        } catch (error) {
            console.error('❌ Component mounting test failed:', error);
            this.testResults.componentMounting.error = error.message;
            return false;
        }
    }

    async testPageAccessibility() {
        console.log('🔍 Testing main page accessibility...');
        
        const pages = [
            { name: 'Home', path: '/' },
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Login', path: '/login' },
            { name: 'Register', path: '/register' }
        ];
        
        const results = {};
        
        for (const page of pages) {
            try {
                console.log(`   Testing ${page.name} page (${page.path})...`);
                
                const response = await this.page.goto(`http://localhost:3000${page.path}`, {
                    waitUntil: 'networkidle2',
                    timeout: 15000
                });
                
                const statusCode = response.status();
                const accessible = statusCode === 200 && response.ok();
                
                // Check if page has content
                const hasContent = await this.page.evaluate(() => {
                    const body = document.body;
                    return body && body.innerText.trim().length > 50;
                });
                
                // Take screenshot of each page
                await this.takeScreenshot(`page-${page.name.toLowerCase()}`, `${page.name} page accessibility`);
                
                results[page.name] = {
                    path: page.path,
                    statusCode,
                    accessible,
                    hasContent,
                    url: this.page.url()
                };
                
                console.log(`   ${page.name}: ${accessible ? '✅' : '❌'} (${statusCode})`);
                
            } catch (error) {
                console.error(`   ❌ ${page.name} page test failed:`, error.message);
                results[page.name] = {
                    path: page.path,
                    accessible: false,
                    error: error.message
                };
            }
        }
        
        this.testResults.pageAccessibility = results;
        return results;
    }

    async testAuthenticationFlow() {
        console.log('🔍 Testing authentication flow...');
        
        try {
            // Test login page accessibility and form elements
            await this.page.goto('http://localhost:3000/login', {
                waitUntil: 'networkidle2'
            });
            
            const loginPageLoaded = await this.page.evaluate(() => {
                const title = document.title;
                const hasLoginForm = document.querySelector('form') !== null;
                const hasEmailInput = document.querySelector('input[type="email"], input[name="email"]') !== null;
                const hasPasswordInput = document.querySelector('input[type="password"]') !== null;
                const hasSubmitButton = document.querySelector('button[type="submit"], input[type="submit"]') !== null;
                
                return {
                    title,
                    hasLoginForm,
                    hasEmailInput,
                    hasPasswordInput,
                    hasSubmitButton
                };
            });
            
            await this.takeScreenshot('auth-login-page', 'Login page form elements');
            
            // Test register page
            await this.page.goto('http://localhost:3000/register', {
                waitUntil: 'networkidle2'
            });
            
            const registerPageLoaded = await this.page.evaluate(() => {
                const title = document.title;
                const hasRegisterForm = document.querySelector('form') !== null;
                const hasEmailInput = document.querySelector('input[type="email"], input[name="email"]') !== null;
                const hasPasswordInput = document.querySelector('input[type="password"]') !== null;
                const hasSubmitButton = document.querySelector('button[type="submit"], input[type="submit"]') !== null;
                
                return {
                    title,
                    hasRegisterForm,
                    hasEmailInput,
                    hasPasswordInput,
                    hasSubmitButton
                };
            });
            
            await this.takeScreenshot('auth-register-page', 'Register page form elements');
            
            this.testResults.authenticationFlow = {
                loginPage: loginPageLoaded,
                registerPage: registerPageLoaded,
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ Authentication flow test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication flow test failed:', error);
            this.testResults.authenticationFlow.error = error.message;
            return false;
        }
    }

    async checkForJavaScriptErrors() {
        console.log('🔍 Checking for JavaScript errors...');
        
        try {
            // Navigate to main page and wait for any errors
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle2'
            });
            
            // Wait a bit more for any delayed errors
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check for unhandled promise rejections
            const hasUnhandledRejections = await this.page.evaluate(() => {
                return window.__unhandledRejections && window.__unhandledRejections.length > 0;
            });
            
            // Check for React errors
            const reactErrorBoundaries = await this.page.evaluate(() => {
                const errorElements = document.querySelectorAll('[data-react-error-boundary="true"]');
                return errorElements.length;
            });
            
            const consoleErrors = this.testResults.consoleErrors.errors || [];
            const pageErrors = this.testResults.consoleErrors.pageErrors || [];
            
            const totalErrors = consoleErrors.length + pageErrors.length;
            
            this.testResults.consoleErrors.summary = {
                totalConsoleErrors: consoleErrors.length,
                totalPageErrors: pageErrors.length,
                hasUnhandledRejections,
                reactErrorBoundaries,
                totalErrors,
                hasAnyErrors: totalErrors > 0 || hasUnhandledRejections || reactErrorBoundaries > 0
            };
            
            console.log(`✅ JavaScript error check completed`);
            console.log(`   Console Errors: ${consoleErrors.length}, Page Errors: ${pageErrors.length}`);
            
            return totalErrors === 0 && !hasUnhandledRejections && reactErrorBoundaries === 0;
            
        } catch (error) {
            console.error('❌ JavaScript error check failed:', error);
            this.testResults.consoleErrors.checkError = error.message;
            return false;
        }
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');
        
        // Calculate summary
        let passed = 0;
        let failed = 0;
        let total = 0;
        
        // Application loading
        total++;
        if (this.testResults.applicationLoading.loadedSuccessfully) passed++;
        else failed++;
        
        // Component mounting
        total++;
        if (this.testResults.componentMounting.hasReactComponents) passed++;
        else failed++;
        
        // Page accessibility
        const accessiblePages = Object.values(this.testResults.pageAccessibility).filter(p => p.accessible).length;
        const totalPages = Object.keys(this.testResults.pageAccessibility).length;
        total++;
        if (accessiblePages === totalPages) passed++;
        else failed++;
        
        // Console errors
        total++;
        if (!this.testResults.consoleErrors.summary?.hasAnyErrors) passed++;
        else failed++;
        
        // Authentication flow
        total++;
        if (this.testResults.authenticationFlow.loginPage?.hasLoginForm && 
            this.testResults.authenticationFlow.registerPage?.hasRegisterForm) passed++;
        else failed++;
        
        this.testResults.summary = {
            passed,
            failed,
            total,
            successRate: Math.round((passed / total) * 100)
        };
        
        // Create detailed report
        const report = {
            title: 'Application Loading and React Component Verification Report',
            timestamp: new Date().toISOString(),
            testEnvironment: {
                url: 'http://localhost:3000',
                browser: 'Puppeteer',
                viewport: '1920x1080'
            },
            results: this.testResults,
            screenshots: this.screenshots,
            conclusion: this.testResults.summary.successRate >= 80 ? 
                '✅ Application is loading and functioning properly' : 
                '❌ Application has issues that need to be addressed'
        };
        
        // Save report to file
        const reportFilename = `application-loading-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
        
        // Create markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const markdownFilename = `application-loading-test-report-${Date.now()}.md`;
        fs.writeFileSync(markdownFilename, markdownReport);
        
        console.log(`📋 Reports saved:`);
        console.log(`   JSON: ${reportFilename}`);
        console.log(`   Markdown: ${markdownFilename}`);
        
        return report;
    }

    generateMarkdownReport(report) {
        const { results, screenshots, summary, conclusion } = report;
        
        return `# Application Loading and React Component Verification Report

**Generated:** ${new Date().toISOString()}  
**Test Environment:** ${report.testEnvironment.url}  
**Browser:** ${report.testEnvironment.browser}

## 📊 Test Summary

- **Total Tests:** ${summary?.total || 0}
- **Passed:** ${summary?.passed || 0}
- **Failed:** ${summary?.failed || 0}
- **Success Rate:** ${summary?.successRate || 0}%

**Overall Status:** ${conclusion}

---

## 🔍 Test Results

### 1. Application Loading Test

\`\`\`json
${JSON.stringify(results.applicationLoading, null, 2)}
\`\`\`

### 2. React Component Mounting Test

\`\`\`json
${JSON.stringify(results.componentMounting, null, 2)}
\`\`\`

### 3. Page Accessibility Test

\`\`\`json
${JSON.stringify(results.pageAccessibility, null, 2)}
\`\`\`

### 4. JavaScript Error Check

\`\`\`json
${JSON.stringify(results.consoleErrors.summary, null, 2)}
\`\`\`

### 5. Authentication Flow Test

\`\`\`json
${JSON.stringify(results.authenticationFlow, null, 2)}
\`\`\`

---

## 📸 Screenshots

${screenshots.map(screenshot => `
### ${screenshot.name}
- **Description:** ${screenshot.description}
- **File:** ${screenshot.filename}
- **Timestamp:** ${screenshot.timestamp}
`).join('\n')}

---

## 🎯 Recommendations

${(summary && summary.successRate >= 80) ?
    '✅ The application is loading correctly and React components are mounting properly. No immediate action required.' :
    '❌ There are issues with the application loading or component mounting. Please review the failed tests and address the errors identified in this report.'}
`;
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive application loading verification...\n');
        
        try {
            await this.initialize();
            
            // Run all tests
            await this.testApplicationLoading();
            await this.testComponentMounting();
            await this.testPageAccessibility();
            await this.testAuthenticationFlow();
            await this.checkForJavaScriptErrors();
            
            // Generate report
            const report = await this.generateReport();
            
            console.log('\n🎉 Application loading verification completed!');
            console.log(`📊 Success Rate: ${report.results.summary.successRate}%`);
            console.log(`📋 Detailed reports have been generated`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Browser closed');
            }
        }
    }
}

// Run the tests
if (require.main === module) {
    const test = new ApplicationLoadingTest();
    test.runAllTests()
        .then(report => {
            console.log('\n✅ All tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = ApplicationLoadingTest;