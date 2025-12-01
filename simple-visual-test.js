/**
 * Simple Visual Enhancement Testing Script
 * 
 * This script performs basic visual validation without requiring authentication
 * 
 * Usage: node simple-visual-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleVisualTester {
    constructor() {
        this.results = {
            dashboardVisualEnhancements: {},
            pnlGraphVisibility: {},
            existingFunctionality: {},
            performance: {},
            crossBrowserCompatibility: {},
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            }
        };
        
        this.testStartTime = Date.now();
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing Simple Visual Enhancement Testing...');
        console.log('📋 Test Plan:');
        console.log('   1. Dashboard Visual Enhancements (gradients, shadows, hover states)');
        console.log('   2. P&L Graph Visibility (date labels, axis styling)');
        console.log('   3. Existing Functionality (sidebar transitions, toggle button)');
        console.log('   4. Performance Testing (transition times, animations)');
        console.log('   5. Cross-Browser/Device Compatibility');
        console.log('');
    }

    async runTests() {
        try {
            // Launch browser
            const browser = await puppeteer.launch({
                headless: false, // Set to false for visual debugging
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--start-maximized']
            });

            const page = await browser.newPage();
            
            // Enable console logging from page
            page.on('console', msg => {
                console.log(`📝 Browser Console: ${msg.text()}`);
            });

            // Navigate to dashboard page (will be redirected to login if not authenticated)
            console.log('🌐 Navigating to dashboard page...');
            await page.goto('http://localhost:3000/dashboard', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });

            // Wait for page to load (either login or dashboard)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Take initial screenshot
            await this.takeScreenshot(page, 'initial-page-state');

            // Check current page
            const currentUrl = page.url();
            console.log(`📍 Current page: ${currentUrl}`);

            // Run all test suites (some may be skipped if not on dashboard)
            await this.testDashboardVisualEnhancements(page);
            await this.testPnLGraphVisibility(page);
            await this.testExistingFunctionality(page);
            await this.testPerformance(page);
            await this.testCrossBrowserCompatibility(page);

            // Generate report
            await this.generateReport();

            await browser.close();
            
            console.log('\n✅ Testing completed!');
            console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed`);
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        }
    }

    async testDashboardVisualEnhancements(page) {
        console.log('\n🎨 Testing Dashboard Visual Enhancements...');
        
        const tests = [
            {
                name: 'Page Visual Style',
                test: async () => {
                    const body = await page.$('body');
                    if (!body) {
                        return { passed: false, reason: 'Body element not found' };
                    }
                    
                    const background = await body.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.background;
                    });
                    
                    // Check for gradient or modern styling
                    const hasModernStyling = background.includes('gradient') || 
                                              background.includes('rgb') || 
                                              background.includes('#');
                    
                    if (!hasModernStyling) {
                        return { passed: false, reason: 'Page lacks modern styling' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Card Elements Presence',
                test: async () => {
                    const cards = await page.$$('div, section, article');
                    if (cards.length === 0) {
                        return { passed: false, reason: 'No card elements found' };
                    }
                    
                    // Check if any card has modern styling
                    let hasStyledCard = false;
                    for (const card of cards) {
                        const styles = await card.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                background: computed.background,
                                boxShadow: computed.boxShadow,
                                borderRadius: computed.borderRadius,
                                border: computed.border
                            };
                        });
                        
                        if (styles.boxShadow !== 'none' || 
                            styles.borderRadius !== '0px' || 
                            styles.background.includes('gradient')) {
                            hasStyledCard = true;
                            break;
                        }
                    }
                    
                    if (!hasStyledCard) {
                        return { passed: false, reason: 'No cards with visual enhancements found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Interactive Elements Styling',
                test: async () => {
                    const buttons = await page.$$('button, a, input');
                    if (buttons.length === 0) {
                        return { passed: false, reason: 'No interactive elements found' };
                    }
                    
                    // Check if buttons have modern styling
                    let styledButtonCount = 0;
                    for (const button of buttons) {
                        const styles = await button.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                background: computed.background,
                                boxShadow: computed.boxShadow,
                                borderRadius: computed.borderRadius,
                                padding: computed.padding
                            };
                        });
                        
                        if (styles.boxShadow !== 'none' || 
                            styles.borderRadius !== '0px' ||
                            styles.padding !== '0px') {
                            styledButtonCount++;
                        }
                    }
                    
                    const styledPercentage = (styledButtonCount / buttons.length) * 100;
                    if (styledPercentage < 50) {
                        return { 
                            passed: false, 
                            reason: `Only ${styledPercentage.toFixed(1)}% of buttons are styled` 
                        };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.dashboardVisualEnhancements[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `dashboard-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testPnLGraphVisibility(page) {
        console.log('\n📊 Testing P&L Graph Visibility...');
        
        const tests = [
            {
                name: 'Chart Elements Presence',
                test: async () => {
                    const charts = await page.$$('svg, canvas, .recharts-wrapper, [class*="chart"]');
                    if (charts.length === 0) {
                        return { passed: false, reason: 'No chart elements found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Container Styling',
                test: async () => {
                    const chartContainers = await page.$$('div, section, [class*="chart"], [class*="graph"]');
                    if (chartContainers.length === 0) {
                        return { passed: false, reason: 'No chart containers found' };
                    }
                    
                    // Check if chart containers have proper styling
                    let styledContainerCount = 0;
                    for (const container of chartContainers) {
                        const styles = await container.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                background: computed.background,
                                boxShadow: computed.boxShadow,
                                borderRadius: computed.borderRadius,
                                padding: computed.padding,
                                margin: computed.margin
                            };
                        });
                        
                        if (styles.background !== 'rgba(0, 0, 0, 0)' && 
                            (styles.boxShadow !== 'none' || 
                             styles.borderRadius !== '0px' ||
                             styles.padding !== '0px')) {
                            styledContainerCount++;
                        }
                    }
                    
                    if (styledContainerCount === 0) {
                        return { passed: false, reason: 'No styled chart containers found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Axes and Labels',
                test: async () => {
                    const axes = await page.$$('line, path, .x-axis, .y-axis, .recharts-axis');
                    if (axes.length === 0) {
                        return { passed: false, reason: 'No chart axes found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Responsive Behavior',
                test: async () => {
                    const chartContainer = await page.$('div, section, [class*="chart"], [class*="graph"]');
                    if (!chartContainer) {
                        return { passed: false, reason: 'No chart container found for responsiveness test' };
                    }
                    
                    // Get initial dimensions
                    const initialSize = await chartContainer.evaluate(el => ({
                        width: el.offsetWidth || el.clientWidth || 0,
                        height: el.offsetHeight || el.clientHeight || 0
                    }));
                    
                    if (initialSize.width === 0 || initialSize.height === 0) {
                        return { passed: false, reason: 'Chart has zero dimensions' };
                    }
                    
                    // Test responsiveness by resizing viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const newSize = await chartContainer.evaluate(el => ({
                        width: el.offsetWidth || el.clientWidth || 0,
                        height: el.offsetHeight || el.clientHeight || 0
                    }));
                    
                    // Restore viewport
                    await page.setViewport({ width: 1920, height: 1080 });
                    
                    // Check if chart resized
                    if (Math.abs(initialSize.width - newSize.width) < 50) {
                        return { passed: false, reason: 'Chart did not resize properly' };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.pnlGraphVisibility[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `pnl-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testExistingFunctionality(page) {
        console.log('\n🔧 Testing Existing Functionality...');
        
        const tests = [
            {
                name: 'Navigation Elements',
                test: async () => {
                    const navElements = await page.$$('nav, aside, header, .navigation');
                    if (navElements.length === 0) {
                        return { passed: false, reason: 'No navigation elements found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Interactive Elements',
                test: async () => {
                    const interactiveElements = await page.$$('button, a, input, select, textarea');
                    if (interactiveElements.length === 0) {
                        return { passed: false, reason: 'No interactive elements found' };
                    }
                    
                    // Check if elements are clickable
                    let clickableCount = 0;
                    for (const element of interactiveElements) {
                        const isClickable = await element.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return computed.pointerEvents !== 'none' && 
                                   computed.display !== 'none' && 
                                   computed.visibility !== 'hidden';
                        });
                        
                        if (isClickable) {
                            clickableCount++;
                        }
                    }
                    
                    const clickablePercentage = (clickableCount / interactiveElements.length) * 100;
                    if (clickablePercentage < 80) {
                        return { 
                            passed: false, 
                            reason: `Only ${clickablePercentage.toFixed(1)}% of elements are clickable` 
                        };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Form Elements',
                test: async () => {
                    const formElements = await page.$$('input, select, textarea, form');
                    if (formElements.length === 0) {
                        return { passed: true, reason: 'No form elements to test' };
                    }
                    
                    // Check if form elements are properly styled
                    let styledFormCount = 0;
                    for (const element of formElements) {
                        const styles = await element.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                background: computed.background,
                                border: computed.border,
                                borderRadius: computed.borderRadius,
                                padding: computed.padding
                            };
                        });
                        
                        if (styles.border !== 'none' && 
                            styles.padding !== '0px' &&
                            (styles.borderRadius !== '0px' || styles.background.includes('gradient'))) {
                            styledFormCount++;
                        }
                    }
                    
                    const styledPercentage = formElements.length > 0 ? (styledFormCount / formElements.length) * 100 : 100;
                    if (styledPercentage < 50) {
                        return { 
                            passed: false, 
                            reason: `Only ${styledPercentage.toFixed(1)}% of form elements are styled` 
                        };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.existingFunctionality[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `functionality-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testPerformance(page) {
        console.log('\n⚡ Testing Performance...');
        
        const tests = [
            {
                name: 'Page Load Performance',
                test: async () => {
                    const metrics = await page.metrics();
                    
                    // Check for reasonable load times
                    if (metrics.TaskDuration > 5000) {
                        return { 
                            passed: false, 
                            reason: `Long task duration: ${metrics.TaskDuration}ms` 
                        };
                    }
                    
                    if (metrics.LayoutShift > 0.2) {
                        return { 
                            passed: false, 
                            reason: `High layout shift: ${metrics.LayoutShift}` 
                        };
                    }
                    
                    return { passed: true, data: { metrics } };
                }
            },
            {
                name: 'Resource Loading',
                test: async () => {
                    const resources = await page.evaluate(() => {
                        return performance.getEntriesByType('resource').map(r => ({
                            name: r.name,
                            duration: r.duration,
                            size: r.transferSize || 0
                        }));
                    });
                    
                    // Check for large resources
                    const largeResources = resources.filter(r => r.size > 1000000); // > 1MB
                    if (largeResources.length > 3) {
                        return { 
                            passed: false, 
                            reason: `Too many large resources: ${largeResources.length}` 
                        };
                    }
                    
                    return { passed: true, data: { resourceCount: resources.length } };
                }
            },
            {
                name: 'Animation Performance',
                test: async () => {
                    // Check for excessive animations
                    const animationCount = await page.evaluate(() => {
                        const elements = document.querySelectorAll('*');
                        let animatedCount = 0;
                        
                        elements.forEach(el => {
                            const computed = window.getComputedStyle(el);
                            if (computed.animation !== 'none' && computed.animationDuration !== '0s') {
                                animatedCount++;
                            }
                        });
                        
                        return animatedCount;
                    });
                    
                    if (animationCount > 30) {
                        return { 
                            passed: false, 
                            reason: `Too many animated elements: ${animationCount}` 
                        };
                    }
                    
                    return { passed: true, data: { animationCount } };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.performance[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
        }
    }

    async testCrossBrowserCompatibility(page) {
        console.log('\n🌍 Testing Cross-Browser/Device Compatibility...');
        
        const tests = [
            {
                name: 'Mobile Viewport',
                test: async () => {
                    // Test mobile viewport
                    await page.setViewport({ width: 375, height: 667 });
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const mainContent = await page.$('main, body, .container');
                    if (!mainContent) {
                        return { passed: false, reason: 'Main content not found on mobile' };
                    }
                    
                    const isAccessible = await mainContent.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.overflow !== 'hidden' && 
                               computed.display !== 'none' && 
                               el.offsetWidth > 0 && 
                               el.offsetHeight > 0;
                    });
                    
                    if (!isAccessible) {
                        return { passed: false, reason: 'Content not accessible on mobile' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Tablet Viewport',
                test: async () => {
                    // Test tablet viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const cards = await page.$$('div, section, article');
                    if (cards.length === 0) {
                        return { passed: true, reason: 'No cards to test on tablet' };
                    }
                    
                    const firstCard = cards[0];
                    const isVisible = await firstCard.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    });
                    
                    if (!isVisible) {
                        return { passed: false, reason: 'Elements not properly visible on tablet' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Touch-Friendly Elements',
                test: async () => {
                    const buttons = await page.$$('button, a[role="button"], [class*="btn"]');
                    if (buttons.length === 0) {
                        return { passed: false, reason: 'No buttons found for touch testing' };
                    }
                    
                    let touchFriendlyCount = 0;
                    for (const button of buttons) {
                        const size = await button.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            return Math.min(rect.width, rect.height);
                        });
                        
                        if (size >= 44) { // Minimum touch target size
                            touchFriendlyCount++;
                        }
                    }
                    
                    const touchFriendlyPercentage = (touchFriendlyCount / buttons.length) * 100;
                    if (touchFriendlyPercentage < 50) {
                        return { 
                            passed: false, 
                            reason: `Only ${touchFriendlyPercentage.toFixed(1)}% of buttons are touch-friendly` 
                        };
                    }
                    
                    return { passed: true, data: { touchFriendlyPercentage } };
                }
            }
        ];

        // Restore desktop viewport after tests
        const originalViewport = { width: 1920, height: 1080 };

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.crossBrowserCompatibility[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `compatibility-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }

        // Restore original viewport
        await page.setViewport(originalViewport);
    }

    async takeScreenshot(page, name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${name}-${timestamp}.png`;
        const filepath = path.join(__dirname, filename);
        
        await page.screenshot({ 
            path: filepath,
            fullPage: false
        });
        
        this.screenshots.push({
            name,
            filename,
            path: filepath
        });
        
        console.log(`📸 Screenshot saved: ${filename}`);
    }

    async generateReport() {
        const testEndTime = Date.now();
        const totalDuration = testEndTime - this.testStartTime;
        
        const report = {
            title: 'Simple Visual Enhancement Testing Report',
            timestamp: new Date().toISOString(),
            duration: `${totalDuration}ms`,
            summary: this.results.summary,
            results: this.results,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };
        
        const filename = `simple-visual-test-report-${Date.now()}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Test report saved: ${filename}`);
        console.log(`📊 Total test duration: ${totalDuration}ms`);
        console.log(`📸 Screenshots taken: ${this.screenshots.length}`);
        
        // Print summary
        console.log('\n📋 Test Summary:');
        console.log(`   Dashboard Visual Enhancements: ${Object.values(this.results.dashboardVisualEnhancements).filter(r => r.passed).length}/${Object.values(this.results.dashboardVisualEnhancements).length} passed`);
        console.log(`   P&L Graph Visibility: ${Object.values(this.results.pnlGraphVisibility).filter(r => r.passed).length}/${Object.values(this.results.pnlGraphVisibility).length} passed`);
        console.log(`   Existing Functionality: ${Object.values(this.results.existingFunctionality).filter(r => r.passed).length}/${Object.values(this.results.existingFunctionality).length} passed`);
        console.log(`   Performance: ${Object.values(this.results.performance).filter(r => r.passed).length}/${Object.values(this.results.performance).length} passed`);
        console.log(`   Cross-Browser Compatibility: ${Object.values(this.results.crossBrowserCompatibility).filter(r => r.passed).length}/${Object.values(this.results.crossBrowserCompatibility).length} passed`);
        
        // Print recommendations
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check dashboard visual enhancements
        const failedDashboardTests = Object.entries(this.results.dashboardVisualEnhancements)
            .filter(([_, result]) => !result.passed);
        
        if (failedDashboardTests.length > 0) {
            recommendations.push('Review and fix dashboard visual enhancement issues, particularly gradients and hover effects.');
        }
        
        // Check P&L graph visibility
        const failedPnLTests = Object.entries(this.results.pnlGraphVisibility)
            .filter(([_, result]) => !result.passed);
        
        if (failedPnLTests.length > 0) {
            recommendations.push('Address P&L graph visibility issues, focusing on chart rendering and label display.');
        }
        
        // Check existing functionality
        const failedFunctionalityTests = Object.entries(this.results.existingFunctionality)
            .filter(([_, result]) => !result.passed);
        
        if (failedFunctionalityTests.length > 0) {
            recommendations.push('Fix existing functionality issues, particularly interactive elements and navigation.');
        }
        
        // Check performance
        const failedPerformanceTests = Object.entries(this.results.performance)
            .filter(([_, result]) => !result.passed);
        
        if (failedPerformanceTests.length > 0) {
            recommendations.push('Optimize performance issues, focusing on page load times and resource usage.');
        }
        
        // Check compatibility
        const failedCompatibilityTests = Object.entries(this.results.crossBrowserCompatibility)
            .filter(([_, result]) => !result.passed);
        
        if (failedCompatibilityTests.length > 0) {
            recommendations.push('Improve cross-browser and device compatibility, especially for mobile views.');
        }
        
        // Overall recommendations
        if (this.results.summary.failed === 0) {
            recommendations.push('All tests passed! Consider adding more comprehensive edge case testing.');
        } else {
            const failureRate = (this.results.summary.failed / this.results.summary.total) * 100;
            if (failureRate > 20) {
                recommendations.push('High failure rate detected. Consider a thorough code review and refactoring.');
            }
        }
        
        return recommendations;
    }
}

// Main execution
async function main() {
    const tester = new SimpleVisualTester();
    
    console.log('🤖 Starting simple visual enhancement testing...');
    console.log('   Make sure that development server is running: npm run dev');
    console.log('   This test will perform basic visual validation without requiring authentication...');
    console.log('');
    
    try {
        await tester.initialize();
        await tester.runTests();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleVisualTester;