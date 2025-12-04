/**
 * Automated Browser Validation Script
 * 
 * This script runs browser-based validation tests programmatically
 * and generates a comprehensive validation report.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const VALIDATION_PAGE = path.join(__dirname, 'browser-trades-validation.html');

// Test results storage
let validationResults = {
    timestamp: new Date().toISOString(),
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    },
    tests: {},
    performance: {},
    errors: [],
    recommendations: [],
    overallStatus: 'UNKNOWN'
};

async function runBrowserValidation() {
    console.log('🚀 Starting automated browser validation...');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from the page
        page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log(`📄 [BROWSER] ${msg.text()}`);
            } else if (msg.type() === 'error') {
                console.error(`❌ [BROWSER] ${msg.text()}`);
                validationResults.errors.push(msg.text());
            } else if (msg.type() === 'warning') {
                console.warn(`⚠️ [BROWSER] ${msg.text()}`);
                validationResults.summary.warnings++;
            }
        });
        
        // Navigate to validation page
        console.log(`📂 Loading validation page: ${VALIDATION_PAGE}`);
        await page.goto(`file://${VALIDATION_PAGE}`, { waitUntil: 'networkidle0' });
        
        // Wait for page to be ready
        await page.waitForSelector('#startValidation', { timeout: 10000 });
        
        // Start validation
        console.log('🔍 Starting validation tests...');
        await page.click('#startValidation');
        
        // Wait for validation to complete (check for export button to be enabled)
        console.log('⏳ Waiting for validation to complete...');
        await page.waitForFunction(
            () => !document.getElementById('exportResults').disabled,
            { timeout: 60000 }
        );
        
        // Extract results from the page
        console.log('📊 Extracting validation results...');
        
        const results = await page.evaluate(() => {
            // Get summary data
            const totalTests = parseInt(document.getElementById('totalTests').textContent);
            const passedTests = parseInt(document.getElementById('passedTests').textContent);
            const failedTests = parseInt(document.getElementById('failedTests').textContent);
            const successRate = document.getElementById('successRate').textContent;
            
            // Get test details
            const testContainers = document.querySelectorAll('.test-container');
            const tests = {};
            
            testContainers.forEach(container => {
                const titleElement = container.querySelector('.test-title');
                const statusElement = container.querySelector('.test-status');
                const detailsElement = container.querySelector('.test-details');
                
                if (titleElement && statusElement) {
                    const title = titleElement.textContent;
                    const status = statusElement.textContent.toLowerCase();
                    const details = detailsElement ? detailsElement.textContent : '';
                    
                    // Parse category and test name
                    const [category, ...testNameParts] = title.split(': ');
                    const testName = testNameParts.join(': ');
                    
                    if (!tests[category]) {
                        tests[category] = [];
                    }
                    
                    tests[category].push({
                        name: testName,
                        passed: status === 'pass',
                        details,
                        status
                    });
                }
            });
            
            return {
                summary: {
                    totalTests,
                    passed: passedTests,
                    failed: failedTests,
                    successRate
                },
                tests
            };
        });
        
        // Update our results
        validationResults.summary = {
            ...validationResults.summary,
            ...results.summary
        };
        validationResults.tests = results.tests;
        
        // Calculate overall status
        const successRateNum = parseFloat(results.summary.successRate);
        if (successRateNum >= 90) {
            validationResults.overallStatus = 'EXCELLENT';
            validationResults.recommendations.push('All critical fixes are working correctly. The /trades tab should display data properly.');
        } else if (successRateNum >= 75) {
            validationResults.overallStatus = 'GOOD';
            validationResults.recommendations.push('Most fixes are working, but some areas need attention.');
        } else if (successRateNum >= 50) {
            validationResults.overallStatus = 'NEEDS_IMPROVEMENT';
            validationResults.recommendations.push('Several fixes need attention before /trades tab will work properly.');
        } else {
            validationResults.overallStatus = 'CRITICAL';
            validationResults.recommendations.push('Critical issues remain. The /trades tab may not function correctly.');
        }
        
        console.log('✅ Browser validation completed successfully!');
        
    } catch (error) {
        console.error('❌ Browser validation failed:', error);
        validationResults.errors.push(error.message);
        validationResults.overallStatus = 'FAILED';
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function generateReport() {
    console.log('📝 Generating comprehensive validation report...');
    
    const reportPath = path.join(__dirname, `comprehensive-trades-validation-report-${Date.now()}.json`);
    
    // Write detailed report
    fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
    
    // Generate summary
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE TRADES TAB VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${validationResults.overallStatus}`);
    console.log(`Success Rate: ${validationResults.summary.successRate}`);
    console.log(`Total Tests: ${validationResults.summary.totalTests}`);
    console.log(`Passed: ${validationResults.summary.passed}`);
    console.log(`Failed: ${validationResults.summary.failed}`);
    console.log(`Warnings: ${validationResults.summary.warnings}`);
    console.log(`Report saved to: ${reportPath}`);
    
    // Display failed tests
    const failedTests = [];
    for (const [category, tests] of Object.entries(validationResults.tests)) {
        for (const test of tests) {
            if (!test.passed) {
                failedTests.push(`${category}: ${test.name} - ${test.details}`);
            }
        }
    }
    
    if (failedTests.length > 0) {
        console.log('\nFAILED TESTS:');
        failedTests.forEach(test => console.log(`  ❌ ${test}`));
    }
    
    // Display recommendations
    if (validationResults.recommendations.length > 0) {
        console.log('\nRECOMMENDATIONS:');
        validationResults.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }
    
    console.log('='.repeat(80));
    
    return reportPath;
}

// Main execution
async function main() {
    try {
        await runBrowserValidation();
        const reportPath = await generateReport();
        
        // Exit with appropriate code
        const successRate = parseFloat(validationResults.summary.successRate);
        process.exit(successRate >= 75 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Automated validation failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = {
    runBrowserValidation,
    generateReport,
    validationResults
};